"use server";

import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { Task } from "./types";
import type { TaskFormData } from "@/components/tasks/TaskForm";

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
    const { format, addMinutes, parse, parseISO, isValid } = await import('date-fns');
    
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

        // --- FIX APPLIED ---
        // Trust the values from the AI flow. Do not apply defaults here.
        const duration = subtask.durationMinutes;
        const breakTime = subtask.breakMinutes;
        // --- END OF FIX ---
        
        const taskEndTime = addMinutes(taskStartTime, (duration || 0) + (breakTime || 0));

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