// D:\applications\tasks\TaskZenith\src\lib\actions.ts

"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { Task } from "./types";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// CHANGED: Imported setHours and setMinutes for more reliable time setting
import { addMinutes, format, parse, parseISO, isValid, setHours, setMinutes, startOfDay } from 'date-fns';

const getFlows = async () => {
    const { prioritizeTasks: prioritizeTasksFlow } = await import("@/ai/flows/prioritize-tasks");
    const { generateProductivityReports: generateProductivityReportsFlow } = await import("@/ai/flows/generate-productivity-reports");
    const { parseNaturalLanguageTasks } = await import("@/ai/flows/parse-natural-language-tasks");
    return { prioritizeTasksFlow, generateProductivityReportsFlow, parseNaturalLanguageTasks };
};

// ... (getPrioritizedTasks and getProductivityReport functions remain unchanged) ...
export async function getPrioritizedTasks(tasks: Task[], context: string): Promise<{ prioritizedTasks?: string[]; reasoning?: string; error?: string }> {
  try {
    const { prioritizeTasksFlow } = await getFlows();
    const taskTexts = tasks.map(task => {
      let taskString = `- ${task.text}`;
      if (task.subtasks.length > 0) {
        taskString += "\\n  Subtasks:\\n" + task.subtasks.map(st => {
          let subTaskStr = `    - ${st.text} ${st.completed ? "(Completed)" : ""}`;
          if (st.deadline) subTaskStr += ` (Due: ${st.deadline})`;
          if (st.scheduledTime) subTaskStr += ` (At: ${st.scheduledTime})`;
          return subTaskStr;
        }).join("\\n");
      }
      return taskString;
    });

    const input = {
      tasks: taskTexts,
      context: context || "General task list, prioritize based on urgency and importance inferred from text. Consider deadlines and scheduled times if mentioned.",
    };
    const result = await prioritizeTasksFlow(input);
    return { prioritizedTasks: result.prioritizedTasks, reasoning: result.reasoning };
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return { error: "Failed to prioritize tasks. Please try again." };
  }
}

export async function getProductivityReport(tasks: Task[]): Promise<{ analysis?: string; recommendations?: string; error?: string }> {
   try {
    const { generateProductivityReportsFlow } = await getFlows();
    const completedSubTasksDetails: string[] = [];
    tasks.forEach(task => {
      task.subtasks.forEach(st => {
        if (st.completed && st.actualEndTime) {
          completedSubTasksDetails.push(
            `Subtask: "${st.text}" (from task "${task.text}"), Completed At: ${new Date(st.actualEndTime).toLocaleString()}, Duration: ${st.durationMinutes || 'N/A'} mins.`
          );
        }
      });
    });
    
    const userTasksString = completedSubTasksDetails.join("\\n") || "No subtasks completed yet.";
    const userScheduleString = "User has a flexible schedule, primarily working during weekdays. Focus on optimizing task batching and minimizing context switching.";

    if (completedSubTasksDetails.length === 0) {
      return { analysis: "No completed subtasks found to generate a report.", recommendations: "Complete some subtasks to get productivity insights." };
    }
    
    const input = {
      userTasks: userTasksString,
      userSchedule: userScheduleString,
    };
    const result = await generateProductivityReportsFlow(input);
    return { analysis: result.analysis, recommendations: result.recommendations };
  } catch (error) {
    console.error("Error generating productivity report:", error);
    return { error: "Failed to generate productivity report. Please try again." };
  }
}


// ==================================================================
// *** MODIFIED FUNCTION: generateTasksFromNaturalLanguage ***
// ==================================================================
export async function generateTasksFromNaturalLanguage(userInput: string, existingTasks: Task[]): Promise<{ tasksData?: TaskFormData[]; error?: string }> {
  try {
    const { parseNaturalLanguageTasks } = await getFlows();
    
    // 1. Calculate the next available time slot based on existing tasks
    let nextAvailableTime = new Date(); // Default to now
    existingTasks.forEach(task => {
      task.subtasks.forEach(st => {
        let subtaskEndTime: Date | null = null;
        if (st.scheduledStartTime) {
            const scheduledStart = parseISO(st.scheduledStartTime);
            if (isValid(scheduledStart)) {
                // End time is start time + duration + break
                const totalDuration = (st.durationMinutes ?? 25) + (st.breakMinutes ?? 10);
                subtaskEndTime = addMinutes(scheduledStart, totalDuration);
            }
        }
        if (subtaskEndTime && subtaskEndTime > nextAvailableTime) {
            nextAvailableTime = subtaskEndTime;
        }
      });
    });

    // 2. Call the AI to parse the user's input
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const aiResult = await parseNaturalLanguageTasks({ userInput, currentDate });

    if (!aiResult || aiResult.length === 0) {
      return { error: "AI could not identify any tasks from your input. Please try rephrasing." };
    }

    const allTasksData: TaskFormData[] = [];
    
    // This variable will track the start time for the *next group* of tasks.
    // It starts as the next available slot, but will be updated by each group.
    let cursorTime = nextAvailableTime;

    // 3. Process each task group returned by the AI
    for (const taskGroup of aiResult) {
      let groupStartTime: Date;

      // 3a. Determine the starting point for this specific group
      if (taskGroup.deadline && taskGroup.startTime) {
        // USER-SPECIFIED TIME: The AI found a specific date and time. Use it.
        const [hour, minute] = taskGroup.startTime.split(':').map(Number);
        const dateFromAI = parse(taskGroup.deadline, 'yyyy-MM-dd', new Date());
        groupStartTime = setMinutes(setHours(startOfDay(dateFromAI), hour), minute);
      } else {
        // AUTO-SCHEDULE: No time specified by user, so use the next available slot.
        groupStartTime = cursorTime;
      }
      
      let subtaskCursorTime = groupStartTime; // The running time for subtasks within this group

      const scheduledSubtasks = taskGroup.subtasks.map(st => {
        const duration = st.durationMinutes ?? 25;
        const breakTime = st.breakMinutes ?? 10;
        
        const currentSubtaskStartTime = subtaskCursorTime;

        // The next subtask will start after this one ends (including its break)
        subtaskCursorTime = addMinutes(currentSubtaskStartTime, duration + breakTime);

        return {
          id: crypto.randomUUID(),
          text: st.text,
          completed: false,
          durationMinutes: duration,
          breakMinutes: breakTime,
          // Use the calculated values for this specific subtask
          deadline: format(currentSubtaskStartTime, 'yyyy-MM-dd'),
          scheduledTime: format(currentSubtaskStartTime, 'HH:mm'),
        };
      });

      const taskData: TaskFormData = {
        text: taskGroup.text,
        priority: taskGroup.priority || 'medium',
        subtasks: scheduledSubtasks,
      };

      allTasksData.push(taskData);

      // 3b. Update the main cursor for the next task group
      // The next group will start after all subtasks of the current group are finished.
      if (subtaskCursorTime > cursorTime) {
        cursorTime = subtaskCursorTime;
      }
    }

    return { tasksData: allTasksData };

  } catch (error) {
    console.error("Error generating tasks from natural language:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to generate tasks from AI: ${errorMessage}. Please try again.` };
  }
}

// ... (All other functions like signUpUser, getTasksForUser, etc. remain unchanged) ...

interface SignUpUserInput {
  name: string;
  email: string;
  password: string;
}

export async function signUpUser(input: SignUpUserInput): Promise<{ userId?: string; error?: string; message?: string }> {
  console.warn('🚧 [signUpUser Server Action] - This function was called, but signup is expected to be handled client-side. Input:', { name: input.name, email: input.email });
  return { error: 'Server-side signup is currently disabled. Signup should occur client-side.' };
}

function convertTimestamps(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && '_seconds' in obj[key] && '_nanoseconds' in obj[key]) {
        const isoString = new Date(obj[key]._seconds * 1000).toISOString();
        newObj[key] = isoString;
      } else {
        newObj[key] = convertTimestamps(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

export async function getTasksForUser(userId: string): Promise<Task[]> {
  try {
    const tasksRef = adminDb.collection("tasks");
    const snapshot = await tasksRef.where("userId", "==", userId).orderBy("createdAt", "desc").get(); // Added orderBy
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({ id: doc.id, ...data }) as Task;
    });
    return tasks;
  } catch (error) {
    console.error("[getTasksForUser] Error:", error);
    throw error;
  }
}

export async function addTask(userId: string, taskData: TaskFormData): Promise<{ taskId?: string; error?: string }> {
  try {
    const tasksRef = adminDb.collection("tasks");
    if (!userId) return { error: "User ID is required" };
    if (!taskData.text) return { error: "Task text is required" };
    
    const currentDate = new Date();
    const subtasksWithSchedule = taskData.subtasks.map((subtask, index) => {
      let scheduledDateTime: Date;
      if (subtask.scheduledTime && subtask.deadline) {
        scheduledDateTime = parse(`${subtask.deadline} ${subtask.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date());
      } else {
        scheduledDateTime = addMinutes(currentDate, 30 * (index + 1));
      }
      if (!isValid(scheduledDateTime)) {
        scheduledDateTime = addMinutes(currentDate, 30 * (index + 1));
      }
      const newSubtask = {
        ...subtask,
        id: subtask.id || crypto.randomUUID(),
        scheduledTime: format(scheduledDateTime, 'HH:mm'),
        deadline: format(scheduledDateTime, 'yyyy-MM-dd'),
        scheduledStartTime: scheduledDateTime.toISOString(),
      };
      return newSubtask;
    });

    const newTask = {
      text: taskData.text,
      userId,
      priority: taskData.priority || 'medium',
      subtasks: subtasksWithSchedule,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await tasksRef.add(newTask);
    revalidatePath('/'); // Revalidate the root layout
    return { taskId: docRef.id };
  } catch (error) {
    console.error("[addTask] Error adding task:", error);
    return { error: 'Failed to add task. Please try again.' };
  }
}

export async function updateTask(userId: string, taskId: string, data: Partial<Task>): Promise<{ success?: boolean; error?: string }> {
  try {
    const docRef = adminDb.collection("tasks").doc(taskId);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
        return { error: "Unauthorized or task not found." };
    }
    await docRef.update({ ...data, updatedAt: new Date().toISOString() });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("[updateTask] Error:", error);
    return { error: "Failed to update task." };
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const tasksRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await tasksRef.get();
    if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
      return { error: "Unauthorized or task not found." };
    }
    await tasksRef.delete();
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("[deleteTask] Error deleting task:", error);
    return { error: "Failed to delete task" };
  }
}


// ==================================================================
// *** NEW/MODIFIED SERVER ACTIONS FOR ADVANCED TIMELINE FEATURES ***
// ==================================================================

/**
 * Updates the schedule for a single subtask. Used for Drag & Drop.
 */
export async function updateTaskSchedule(data: { subtaskId: string, parentTaskId: string, newStartTime: string }): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const taskRef = adminDb.collection("tasks").doc(data.parentTaskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
      return { error: "Unauthorized or parent task not found." };
    }

    const parentTask = taskDoc.data() as Task;
    const newStartTime = parseISO(data.newStartTime);

    const updatedSubtasks = parentTask.subtasks.map(st => {
      if (st.id === data.subtaskId) {
        return {
          ...st,
          scheduledStartTime: newStartTime.toISOString(),
          deadline: format(newStartTime, 'yyyy-MM-dd'),
          scheduledTime: format(newStartTime, 'HH:mm'),
        };
      }
      return st;
    });

    await taskRef.update({
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/');
    return { success: true };

  } catch (error) {
    console.error("[updateTaskSchedule] Error:", error);
    return { error: "Failed to update task schedule." };
  }
}

/**
 * Deletes a single subtask from a parent task's subtasks array.
 */
export async function deleteSubtask(data: { parentTaskId: string, subtaskId: string }): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;
  const { parentTaskId, subtaskId } = data;

  try {
    const taskRef = adminDb.collection("tasks").doc(parentTaskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
      return { error: "Unauthorized or parent task not found." };
    }

    const parentTask = taskDoc.data() as Task;

    // Filter out the subtask to be deleted
    const updatedSubtasks = parentTask.subtasks.filter(st => st.id !== subtaskId);

    // If all subtasks are deleted, you might want to delete the parent task too.
    // This is optional and depends on your application's logic.
    // For now, we'll just update the subtasks array.
    if (updatedSubtasks.length === 0 && parentTask.subtasks.length > 0) {
        // Optional: you could delete the parent task if it becomes empty
        // await taskRef.delete();
        // Or just update it with an empty array
        await taskRef.update({
            subtasks: [],
            updatedAt: new Date().toISOString(),
        });
    } else {
        // Update the parent task with the new subtasks array
        await taskRef.update({
            subtasks: updatedSubtasks,
            updatedAt: new Date().toISOString(),
        });
    }

    revalidatePath('/'); // Revalidate to update the UI
    return { success: true };

  } catch (error) {
    console.error("[deleteSubtask] Error:", error);
    return { error: "Failed to delete subtask." };
  }
}


/**
 * Placeholder for an AI-powered day optimization logic.
 * This function is called when the "Optimize My Day" button is clicked.
 * Currently, it just logs the request. You can expand this with real AI logic.
 */
export async function optimizeDaySchedule(data: { tasks: Task[], date: string }): Promise<{ success?: boolean; error?:string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  
  // In a real application, you would:
  // 1. Get all unscheduled tasks for the user.
  // 2. Get all scheduled tasks for the given date to identify free time slots.
  // 3. Call an AI model (like the ones from `getFlows`) with the list of unscheduled tasks and free slots.
  // 4. The AI would return an optimized schedule.
  // 5. You would then update all the affected tasks in Firebase.
  
  console.log("===================================");
  console.log("🚀 AI Day Optimization Triggered 🚀");
  console.log("User:", session.user.email);
  console.log("Date to optimize:", data.date);
  console.log("This is a placeholder. No tasks were actually changed.");
  console.log("===================================");

  // We are not changing data, but we revalidate to show a "refresh" effect.
  revalidatePath('/');

  // Simulate a delay to make it feel like AI is "thinking"
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true };
}