// D:\applications\tasks\final\TaskZenith\src\lib\actions\quick-tasks.actions.ts
"use server";

import { TaskGroup, QuickTask } from "@/types/quick-task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function saveTaskGroupsAction(groups: TaskGroup[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User must be authenticated to save tasks.");
  }

  const userId = session.user.id;
  const groupsCollection = adminDb.collection(`users/${userId}/taskGroups`);
  const batch = adminDb.batch();

  // --- IMPROVEMENT: Handle deleted groups ---
  // This logic ensures that if a group is deleted on the client,
  // it gets deleted from the database as well.
  const groupsToSaveIds = new Set(groups.map(g => g.id));
  const existingGroupsSnapshot = await groupsCollection.get();
  existingGroupsSnapshot.forEach(doc => {
    if (!groupsToSaveIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // --- FIX: Use a for...of loop to handle async operations correctly ---
  for (const group of groups) {
    const groupDocRef = groupsCollection.doc(group.id);
    
    // Prepare group data
    const groupData: any = {
      id: group.id,
      title: group.title,
    };
    if (group.icon) {
      groupData.icon = group.icon;
    }
    batch.set(groupDocRef, groupData, { merge: true });
    
    const tasksCollectionRef = groupDocRef.collection('tasks');
    
    // --- NEW: Logic to handle deleted tasks within a group ---
    const clientTaskIds = new Set(group.tasks.map(t => t.id));
    const existingTasksSnapshot = await tasksCollectionRef.get();
    existingTasksSnapshot.forEach(doc => {
        if (!clientTaskIds.has(doc.id)) {
            batch.delete(doc.ref);
        }
    });

    // --- Logic to update/create tasks ---
    group.tasks.forEach(task => {
        const taskDocRef = tasksCollectionRef.doc(task.id);
        const taskData: any = {
            id: task.id,
            text: task.text,
            completed: task.completed,
            order: task.order,
        };
        if (task.color) { taskData.color = task.color; }
        batch.set(taskDocRef, taskData);
    });
  }

  await batch.commit();
  return { success: true };
}


export async function getTaskGroupsAction(): Promise<TaskGroup[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) { return []; }

  const userId = session.user.id;
  try {
    const groupsCollection = adminDb.collection(`users/${userId}/taskGroups`);
    const groupsSnapshot = await groupsCollection.get();
    
    if (groupsSnapshot.empty) { return []; }
    
    const groupsWithTasks = await Promise.all(
      groupsSnapshot.docs.map(async (groupDoc) => {
        const groupData = groupDoc.data();
        const tasksCollection = groupDoc.ref.collection('tasks');
        const tasksSnapshot = await tasksCollection.orderBy("order", "asc").get();
        
        const tasks = tasksSnapshot.docs.map(taskDoc => {
            const taskData = taskDoc.data();
            return {
                id: taskDoc.id, text: taskData.text, completed: taskData.completed, order: taskData.order, color: taskData.color || undefined,
            } as QuickTask;
        });

        // --- CHANGE 2: Retrieve the new 'icon' property ---
        return {
            id: groupDoc.id,
            title: groupData.title,
            icon: groupData.icon || undefined, // Add the icon field
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