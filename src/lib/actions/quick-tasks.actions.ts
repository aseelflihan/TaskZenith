"use server";

import { QuickTask } from "@/types/quick-task";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { firestore } from "@/lib/firebase-admin";

export async function saveQuickTasksAction(tasks: QuickTask[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("User must be authenticated to save tasks.");
  }

  const userId = session.user.id;
  const quickTasksCollection = firestore.collection(`users/${userId}/quickTasks`);

  const batch = firestore.batch();
  tasks.forEach((task) => {
    const docRef = quickTasksCollection.doc(task.id);
    batch.set(docRef, task);
  });

  await batch.commit();

  return { success: true };
}