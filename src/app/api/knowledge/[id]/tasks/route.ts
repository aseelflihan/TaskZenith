import { NextRequest, NextResponse } from 'next/server';
import { knowledgeItems } from '../../db';

// This is a placeholder for a real task database or service
let mainTaskList: any[] = [];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { tasks } = await req.json();

    const knowledgeItem = knowledgeItems.find((item: any) => item.id === id);

    if (!knowledgeItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (!tasks || !Array.isArray(tasks)) {
        return NextResponse.json({ error: 'Tasks are required and must be an array' }, { status: 400 });
    }

    // Add tasks to the main task list
    const newTasks = tasks.map((task: any) => ({
        id: crypto.randomUUID(),
        text: task.text,
        completed: false,
        createdAt: new Date().toISOString(),
        knowledgeSourceId: id,
    }));

    mainTaskList.push(...newTasks);

    console.log("Tasks added to main list:", newTasks);
    console.log("Current main task list:", mainTaskList);

    return NextResponse.json({ message: 'Tasks added successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error adding tasks:', error);
    return NextResponse.json({ error: 'Failed to add tasks' }, { status: 500 });
  }
}