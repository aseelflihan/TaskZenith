"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { Task } from "./types";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addMinutes, format, parse, parseISO, isValid } from 'date-fns';

const getFlows = async () => {
    const { prioritizeTasks: prioritizeTasksFlow } = await import("@/ai/flows/prioritize-tasks");
    const { generateProductivityReports: generateProductivityReportsFlow } = await import("@/ai/flows/generate-productivity-reports");
    const { parseNaturalLanguageTasks } = await import("@/ai/flows/parse-natural-language-tasks");
    return { prioritizeTasksFlow, generateProductivityReportsFlow, parseNaturalLanguageTasks };
};

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

export async function generateTasksFromNaturalLanguage(userInput: string, existingTasks: Task[]): Promise<{ tasksData?: TaskFormData[]; error?: string }> {
  try {
    const { parseNaturalLanguageTasks } = await getFlows();
    
    let nextAvailableTime = new Date();
    
    existingTasks.forEach(task => {
      task.subtasks.forEach(st => {
        let subtaskEndTime: Date | null = null;
        if (st.completed && st.actualEndTime) {
          const actualEnd = parseISO(st.actualEndTime);
          if (isValid(actualEnd)) {
            subtaskEndTime = addMinutes(actualEnd, st.breakMinutes ?? 0);
          }
        } 
        else if (!st.completed && st.scheduledStartTime) {
          const scheduledStart = parseISO(st.scheduledStartTime);
          if (isValid(scheduledStart)) {
            const totalDuration = (st.durationMinutes ?? 0) + (st.breakMinutes ?? 0);
            subtaskEndTime = addMinutes(scheduledStart, totalDuration);
          }
        }
        
        if (subtaskEndTime && subtaskEndTime > nextAvailableTime) {
          nextAvailableTime = subtaskEndTime;
        }
      });
    });

    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const aiResult = await parseNaturalLanguageTasks({ userInput, currentDate });

    if (!aiResult || aiResult.length === 0) {
      return { error: "AI could not identify any tasks from your input." };
    }

    const allTasksData: TaskFormData[] = [];
    
    for (const taskGroup of aiResult) {
      const scheduledSubtasks = taskGroup.subtasks.map(st => {
        const subtask = { ...st }; 

        if (!subtask.scheduledTime) {
          subtask.deadline = format(nextAvailableTime, 'yyyy-MM-dd');
          subtask.scheduledTime = format(nextAvailableTime, 'HH:mm');
        }

        const taskStartTime = parse(
          `${subtask.deadline || format(nextAvailableTime, 'yyyy-MM-dd')} ${subtask.scheduledTime}`,
          'yyyy-MM-dd HH:mm',
          new Date()
        );

        // Ensure duration and breakTime are numbers, providing defaults if undefined
        const duration = subtask.durationMinutes ?? 25;
        const breakTime = subtask.breakMinutes ?? 0;
        
        const taskEndTime = addMinutes(taskStartTime, duration + breakTime);

        if (taskEndTime > nextAvailableTime) {
          nextAvailableTime = taskEndTime;
        }
        
        return {
          id: crypto.randomUUID(),
          text: subtask.text,
          completed: false,
          // Pass the potentially undefined values. The final handler (in page.tsx)
          // will set final, safe defaults if needed.
          durationMinutes: duration,
          breakMinutes: breakTime,
          deadline: subtask.deadline,
          scheduledTime: subtask.scheduledTime,
        };
      });

      const taskData: TaskFormData = {
        text: taskGroup.text,
        priority: taskGroup.priority || 'medium',
        subtasks: scheduledSubtasks,
      };

      allTasksData.push(taskData);
    }

    return { tasksData: allTasksData };

  } catch (error) {
    console.error("Error generating tasks from natural language:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to generate tasks from AI: ${errorMessage}. Please try again.` };
  }
}

interface SignUpUserInput {
  name: string;
  email: string;
  password: string;
}

export async function signUpUser(input: SignUpUserInput): Promise<{ userId?: string; error?: string; message?: string }> {
  console.warn('🚧 [signUpUser Server Action] - This function was called, but signup is expected to be handled client-side. Input:', { name: input.name, email: input.email });
  return { error: 'Server-side signup is currently disabled. Signup should occur client-side.' };
}

// تحويل جميع حقول Timestamp إلى string بتنسيق ISO
function convertTimestamps(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (
        obj[key] &&
        typeof obj[key] === 'object' &&
        '_seconds' in obj[key] &&
        '_nanoseconds' in obj[key]
      ) {
        // تحويل إلى تنسيق ISO string وطباعة للتحقق
        const isoString = new Date(obj[key]._seconds * 1000).toISOString();
        console.log(`Converting timestamp for ${key}:`, isoString);
        newObj[key] = isoString;
      } else {
        newObj[key] = convertTimestamps(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// جلب جميع المهام الخاصة بمستخدم مع تحويل التواريخ
export async function getTasksForUser(userId: string): Promise<Task[]> {
  console.log("[getTasksForUser] Fetching tasks for userId:", userId);
  try {
    const tasksRef = adminDb.collection("tasks");
    const snapshot = await tasksRef.where("userId", "==", userId).get();
    console.log("[getTasksForUser] Found", snapshot.size, "tasks");
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({ 
        id: doc.id,
        ...data
      }) as Task;
    });
    
    console.log("[getTasksForUser] Processed tasks:", tasks);
    return tasks;
  } catch (error) {
    console.error("[getTasksForUser] Error:", error);
    throw error;
  }
}

// إضافة مهمة جديدة مع تحسينات
export async function addTask(userId: string, taskData: TaskFormData): Promise<{ taskId?: string; error?: string }> {
  try {
    console.log("[addTask] Starting to add task for userId:", userId);
    const tasksRef = adminDb.collection("tasks");
    
    if (!userId) {
      console.error("[addTask] Missing userId");
      return { error: "User ID is required" };
    }

    if (!taskData.text) {
      console.error("[addTask] Missing task text");
      return { error: "Task text is required" };
    }
    
    // معالجة المهام الفرعية وإضافة الجدول الزمني
    const currentDate = new Date();
    const subtasksWithSchedule = taskData.subtasks.map((subtask, index) => {
      console.log(`[addTask] Processing subtask ${index + 1}:`, {
        original: subtask,
        deadline: subtask.deadline,
        scheduledTime: subtask.scheduledTime
      });

      // تحديد وقت الجدولة
      let scheduledDateTime: Date;
      
      if (subtask.scheduledTime && subtask.deadline) {
        try {
          // Attempt to parse date and time directly from YYYY-MM-DD HH:mm
          scheduledDateTime = parse(
            `${subtask.deadline} ${subtask.scheduledTime}`,
            'yyyy-MM-dd HH:mm',
            new Date()
          );

          console.log(`[addTask] Parsed datetime for subtask ${index + 1}:`, {
            deadline: subtask.deadline,
            scheduledTime: subtask.scheduledTime,
            result: scheduledDateTime,
            isValid: isValid(scheduledDateTime)
          });
        } catch (error) {
          console.error(`[addTask] Error parsing date for subtask ${index + 1}:`, error);
          scheduledDateTime = addMinutes(currentDate, 30 * (index + 1));
        }
      } else {
        scheduledDateTime = addMinutes(currentDate, 30 * (index + 1));
      }

      // تأكد من صحة التاريخ
      if (!isValid(scheduledDateTime)) {
        console.warn(`[addTask] Invalid date for subtask ${index + 1}, using default`);
        scheduledDateTime = addMinutes(currentDate, 30 * (index + 1));
      }

      const result = {
        ...subtask,
        scheduledTime: format(scheduledDateTime, 'HH:mm'),
        deadline: format(scheduledDateTime, 'yyyy-MM-dd')
      };

      console.log(`[addTask] Final subtask ${index + 1} data:`, result);
      return result;
    });

    const newTask = {
      text: taskData.text,
      userId,
      priority: taskData.priority || 'medium',
      subtasks: subtasksWithSchedule,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("[addTask] Attempting to save task:", newTask);
    const docRef = await tasksRef.add(newTask);
    console.log("[addTask] Task added successfully with ID:", docRef.id);
    revalidatePath('/app'); // Add this line
    
    return { taskId: docRef.id };
  } catch (error) {
    console.error("[addTask] Error adding task:", error);
    return { error: 'Failed to add task. Please try again.' };
  }
}

// تحديث مهمة
export async function updateTask(userId: string, taskId: string, data: Partial<Task>): Promise<void> {
  const docRef = adminDb.collection("tasks").doc(taskId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) throw new Error("Unauthorized");
  await docRef.update(data);
  revalidatePath('/app'); // Add this line
}

// حذف مهمة
export async function deleteTask(userId: string, taskId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    console.log("[deleteTask] Starting to delete task:", taskId, "for user:", userId);
    const tasksRef = adminDb.collection("tasks");
    
    // التحقق من وجود المهمة وملكيتها للمستخدم
    const taskDoc = await tasksRef.doc(taskId).get();
    if (!taskDoc.exists) {
      console.error("[deleteTask] Task not found:", taskId);
      return { error: "Task not found" };
    }

    const taskData = taskDoc.data();
    if (taskData?.userId !== userId) {
      console.error("[deleteTask] Task does not belong to user:", userId);
      return { error: "Unauthorized to delete this task" };
    }    // حذف المهمة
    await tasksRef.doc(taskId).delete();
    console.log("[deleteTask] Successfully deleted task:", taskId);

    // Revalidate the path for the Daily Timeline page to ensure data is fresh
    revalidatePath('/app');

    return { success: true };
  } catch (error) {
    console.error("[deleteTask] Error deleting task:", error);
    return { error: "Failed to delete task" };
  }
}
