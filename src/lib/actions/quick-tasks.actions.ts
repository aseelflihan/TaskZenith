// D:\applications\tasks\final\TaskZenith\src\lib\actions\quick-tasks.actions.ts
"use server";

// --- CHANGE 1: Import both TaskGroup and QuickTask types ---
import { TaskGroup, QuickTask } from "@/types/quick-task";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase-admin";

// --- CHANGE 2: The save function now accepts an array of TaskGroup ---
export async function saveTaskGroupsAction(groups: TaskGroup[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User must be authenticated to save tasks.");
  }

  const userId = session.user.id;
  // We will now use a top-level collection for groups
  const groupsCollection = adminDb.collection(`users/${userId}/taskGroups`);

  const batch = adminDb.batch();

  // The logic now iterates through groups and their tasks
  groups.forEach((group) => {
    const groupDocRef = groupsCollection.doc(group.id);
    
    // Save the group's metadata (id and title)
    batch.set(groupDocRef, {
      id: group.id,
      title: group.title,
    });
    
    // For each task within the group, save it in a sub-collection
    group.tasks.forEach(task => {
        const taskDocRef = groupDocRef.collection('tasks').doc(task.id);
        const taskData: any = {
            id: task.id,
            text: task.text,
            completed: task.completed,
            order: task.order,
        };
        // Conditionally add color only if it exists
        if (task.color) {
            taskData.color = task.color;
        }
        batch.set(taskDocRef, taskData);
    });
  });

  await batch.commit();

  return { success: true };
}

// --- CHANGE 3: The get function now returns an array of TaskGroup ---
export async function getTaskGroupsAction(): Promise<TaskGroup[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  const userId = session.user.id;
  try {
    const groupsCollection = adminDb.collection(`users/${userId}/taskGroups`);
    const groupsSnapshot = await groupsCollection.get();
    
    if (groupsSnapshot.empty) {
      return [];
    }
    
    // Use Promise.all to fetch all tasks for all groups concurrently
    const groupsWithTasks = await Promise.all(
      groupsSnapshot.docs.map(async (groupDoc) => {
        const groupData = groupDoc.data();
        const tasksCollection = groupDoc.ref.collection('tasks');
        const tasksSnapshot = await tasksCollection.orderBy("order", "asc").get();
        
        const tasks = tasksSnapshot.docs.map(taskDoc => {
            const taskData = taskDoc.data();
            return {
                id: taskDoc.id,
                text: taskData.text,
                completed: taskData.completed,
                order: taskData.order,
                color: taskData.color || undefined,
            } as QuickTask;
        });

        return {
            id: groupDoc.id,
            title: groupData.title,
            tasks: tasks,
        } as TaskGroup;
      })
    );

    return groupsWithTasks;

  } catch (error) {
    console.error("Error fetching task groups:", error);
    return [];
  }
}