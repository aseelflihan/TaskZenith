// D:\applications\tasks\TaskZenith\src\lib\actions.ts

"use server";

import { revalidatePath } from 'next/cache';
import type { Task } from "./types";
import type { QuickTask } from "@/types/quick-task";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addMinutes, format, parse, parseISO, isValid, setHours, setMinutes, startOfDay } from 'date-fns';

const getFlows = async () => {
    const { prioritizeTasks: prioritizeTasksFlow } = await import("@/ai/flows/prioritize-tasks");
    const { generateProductivityReports: generateProductivityReportsFlow } = await import("@/ai/flows/generate-productivity-reports");
    const { parseNaturalLanguageTasks } = await import("@/ai/flows/parse-natural-language-tasks");
    return { prioritizeTasksFlow, generateProductivityReportsFlow, parseNaturalLanguageTasks };
};

// ... Other functions like getPrioritizedTasks, getProductivityReport remain unchanged ...
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
    
    // *** CHANGE: The block of code that scans existingTasks to find the "next available time" has been removed. ***
    // We will now always start scheduling from the current time unless specified by the user.

    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const aiResult = await parseNaturalLanguageTasks({ userInput, currentDate });

    if (!aiResult || aiResult.length === 0) {
      return { error: "AI could not identify any tasks from your input. Please try rephrasing." };
    }

    const allTasksData: TaskFormData[] = [];
    // *** CHANGE: The schedule cursor now always starts from the current time. ***
    let scheduleCursor = new Date();

    for (const taskGroup of aiResult) {
      let groupStartTime: Date | null = null;

      if (taskGroup.deadline && taskGroup.startTime) {
        const [hour, minute] = taskGroup.startTime.split(':').map(Number);
        const parsedDate = parse(taskGroup.deadline, 'yyyy-MM-dd', new Date());

        if (isValid(parsedDate) && !isNaN(hour) && !isNaN(minute)) {
            groupStartTime = setMinutes(setHours(startOfDay(parsedDate), hour), minute);
        }
      }

      // If no valid time was found from AI, fall back to the schedule cursor.
      // On the first loop, this will be the current time (new Date()).
      if (!groupStartTime || !isValid(groupStartTime)) {
        groupStartTime = scheduleCursor;
      }
      
      let subtaskTimeTracker = groupStartTime;

      const scheduledSubtasks = taskGroup.subtasks.map(st => {
        const duration = st.durationMinutes ?? 25;
        const breakTime = st.breakMinutes ?? 10;
        
        const currentSubtaskStartTime = subtaskTimeTracker;
        subtaskTimeTracker = addMinutes(currentSubtaskStartTime, duration + breakTime);

        return {
          id: crypto.randomUUID(),
          text: st.text,
          completed: false,
          durationMinutes: duration,
          breakMinutes: breakTime,
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

      // Update the main schedule cursor so the *next task group from the same AI call*
      // starts after the current one finishes.
      if (subtaskTimeTracker > scheduleCursor) {
        scheduleCursor = subtaskTimeTracker;
      }
    }

    return { tasksData: allTasksData };

  } catch (error) {
    console.error("Error generating tasks from natural language:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to generate tasks from AI: ${errorMessage}. Please try again.` };
  }
}


// --- The following functions are unchanged ---

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
    const snapshot = await tasksRef.where("userId", "==", userId).orderBy("createdAt", "desc").get();
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
    console.log('📋 =============================================================');
    console.log('📋 addTask() called from Knowledge Hub');
    console.log('📋 UserId:', userId);
    console.log('📋 TaskData:', JSON.stringify(taskData, null, 2));
    console.log('📋 =============================================================');
    
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

    console.log('📋 Final task object to be saved:', JSON.stringify(newTask, null, 2));

    const docRef = await tasksRef.add(newTask);
    console.log('📋 ✅ Task saved to Firestore with ID:', docRef.id);
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    console.log('📋 ✅ Paths revalidated for cache refresh');
    
    return { taskId: docRef.id };
  } catch (error) {
    console.error("[addTask] ❌ Error adding task:", error);
    console.error("[addTask] ❌ Error details:", error instanceof Error ? error.message : 'Unknown error');
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
    const updatedSubtasks = parentTask.subtasks.filter(st => st.id !== subtaskId);

    if (updatedSubtasks.length === 0 && parentTask.subtasks.length > 0) {
        await taskRef.update({
            subtasks: [],
            updatedAt: new Date().toISOString(),
        });
    } else {
        await taskRef.update({
            subtasks: updatedSubtasks,
            updatedAt: new Date().toISOString(),
        });
    }

    revalidatePath('/');
    return { success: true };

  } catch (error) {
    console.error("[deleteSubtask] Error:", error);
    return { error: "Failed to delete subtask." };
  }
}

export async function optimizeDaySchedule(data: { tasks: Task[], date: string }): Promise<{ success?: boolean; error?:string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  
  console.log("===================================");
  console.log("🚀 AI Day Optimization Triggered 🚀");
  console.log("User:", session.user.email);
  console.log("Date to optimize:", data.date);
  console.log("This is a placeholder. No tasks were actually changed.");
  console.log("===================================");

  revalidatePath('/');

  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true };
}
export async function saveQuickTasksAction(tasks: QuickTask[]): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const quickTasksCollection = adminDb.collection(`users/${userId}/quickTasks`);
    const batch = adminDb.batch();
    tasks.forEach((task) => {
      const docRef = quickTasksCollection.doc(task.id);
      batch.set(docRef, task);
    });
    await batch.commit();
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("[saveQuickTasksAction] Error:", error);
    return { error: "Failed to save quick tasks." };
  }
}