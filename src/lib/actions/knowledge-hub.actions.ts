"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addTask } from "@/lib/actions";
import { TaskFormData } from "@/components/tasks/TaskForm";
import { KnowledgeItem } from "../types";

export async function addKnowledgeHubTasksAction(item: KnowledgeItem): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    // Create one main task with the title of the knowledge item.
    // The AI-extracted tasks will become subtasks.
    const mainTaskText = `Process: ${item.title}`;

    const subtasks = item.tasks.map(task => ({
      id: crypto.randomUUID(),
      text: task.text,
      completed: false,
      durationMinutes: 25, // Default duration
      breakMinutes: 5,     // Default break
    }));

    const taskData: TaskFormData = {
      text: mainTaskText,
      priority: 'medium',
      subtasks: subtasks,
    };

    const result = await addTask(userId, taskData);

    if (result.error) {
      console.error("Error adding task from Knowledge Hub:", result.error);
      return { success: false, error: `Failed to add task: "${mainTaskText}". Reason: ${result.error}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error adding tasks from Knowledge Hub:", error);
    return { success: false, error: "An unexpected error occurred while adding tasks." };
  }
}