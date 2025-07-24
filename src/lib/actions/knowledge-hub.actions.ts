"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addTask, getTasksForUser } from "@/lib/actions";
import { TaskFormData } from "@/components/tasks/TaskForm";
import { KnowledgeItem } from "../types";
import { revalidatePath } from "next/cache";

interface TaskAddResult {
  success: boolean;
  taskId?: string;
  error?: string;
  details?: {
    taskText: string;
    taskId?: string;
    priority: string;
    deadline?: string;
    userId: string;
    timestamp: string;
    verificationStatus: 'pending' | 'verified' | 'failed';
    dashboardAppearance: boolean;
  };
}

export async function addKnowledgeHubTasksAction(item: KnowledgeItem): Promise<TaskAddResult> {
  console.log('🚀 =============================================================');
  console.log('🚀 Starting Knowledge Hub Task Addition Process');
  console.log('🚀 =============================================================');
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('❌ Authentication failed - No user session found');
    return { 
      success: false, 
      error: "User not authenticated.",
      details: {
        taskText: 'Unknown',
        priority: 'Unknown',
        userId: 'Not authenticated',
        timestamp: new Date().toISOString(),
        verificationStatus: 'failed',
        dashboardAppearance: false
      }
    };
  }
  
  const userId = session.user.id;
  console.log('✅ User authenticated:', userId);

  try {
    // Validate input
    if (!item.tasks || item.tasks.length === 0) {
      console.error('❌ No tasks found in knowledge item');
      return { 
        success: false, 
        error: "No tasks to add.",
        details: {
          taskText: 'No tasks provided',
          priority: 'Unknown',
          userId,
          timestamp: new Date().toISOString(),
          verificationStatus: 'failed',
          dashboardAppearance: false
        }
      };
    }

    // Get the single task (there should only be one from our new system)
    const singleTask = item.tasks[0] as any;
    console.log('📝 Processing single task from Knowledge Hub:');
    console.log('   - Text:', singleTask.text);
    console.log('   - Priority:', singleTask.priority);
    console.log('   - Deadline:', singleTask.deadline);
    console.log('   - Duration:', singleTask.durationMinutes);

    // Create subtask with the full task details
    const subtask = {
      id: crypto.randomUUID(),
      text: item.summary, // Use the summary for the subtask description
      completed: false,
      durationMinutes: singleTask.durationMinutes || 25,
      breakMinutes: 5,
      deadline: singleTask.deadline,
      scheduledTime: "09:00", // Provide a default time to ensure the deadline date is respected
    };

    const taskData: TaskFormData = {
      text: singleTask.text, // Keep the smart task text as the main task title
      priority: singleTask.priority || determinePriority(item),
      subtasks: [subtask], // Single subtask containing all the details
    };

    console.log('📋 TaskFormData structure created:');
    console.log('   - Main Text:', taskData.text);
    console.log('   - Priority:', taskData.priority);
    console.log('   - Subtasks Count:', taskData.subtasks.length);
    console.log('   - Subtask Details:', taskData.subtasks[0]);

    // Get tasks count before adding
    const tasksBeforeAdd = await getTasksForUser(userId);
    const tasksCountBefore = tasksBeforeAdd.length;
    console.log('📊 Tasks in dashboard before addition:', tasksCountBefore);

    // Attempt to add the task
    console.log('🔄 Calling addTask function...');
    const result = await addTask(userId, taskData);

    if (result.error) {
      console.error('❌ addTask returned error:', result.error);
      return { 
        success: false, 
        error: `Failed to add task: "${singleTask.text}". Reason: ${result.error}`,
        details: {
          taskText: singleTask.text,
          priority: taskData.priority,
          deadline: singleTask.deadline,
          userId,
          timestamp: new Date().toISOString(),
          verificationStatus: 'failed',
          dashboardAppearance: false
        }
      };
    }

    console.log('✅ addTask completed successfully. Task ID:', result.taskId);

    // Verify the task was actually added to the dashboard
    console.log('🔍 Verifying task addition to dashboard...');
    const tasksAfterAdd = await getTasksForUser(userId);
    const tasksCountAfter = tasksAfterAdd.length;
    
    console.log('📊 Tasks in dashboard after addition:', tasksCountAfter);
    console.log('📈 Task count difference:', tasksCountAfter - tasksCountBefore);

    // Check if the new task exists
    const newTask = tasksAfterAdd.find(task => task.id === result.taskId);
    const taskFoundInDashboard = !!newTask;
    
    console.log('🔍 New task found in dashboard:', taskFoundInDashboard);
    if (newTask) {
      console.log('✅ Task verification successful:');
      console.log('   - ID:', newTask.id);
      console.log('   - Text:', newTask.text);
      console.log('   - Priority:', newTask.priority);
      console.log('   - Subtasks:', newTask.subtasks.length);
      console.log('   - Created At:', newTask.createdAt);
    }

    const verificationStatus: 'pending' | 'verified' | 'failed' = 
      taskFoundInDashboard ? 'verified' : 'failed';

    console.log('🚀 =============================================================');
    console.log('🚀 Knowledge Hub Task Addition Process COMPLETED');
    console.log(`🚀 Status: ${verificationStatus.toUpperCase()}`);
    console.log('🚀 =============================================================');
    
    // Force revalidation of dashboard page to refresh task list
    console.log('🔄 Revalidating dashboard path...');
    revalidatePath('/dashboard');
    revalidatePath('/');
    
    return { 
      success: true,
      taskId: result.taskId,
      details: {
        taskText: singleTask.text,
        taskId: result.taskId,
        priority: taskData.priority,
        deadline: singleTask.deadline,
        userId,
        timestamp: new Date().toISOString(),
        verificationStatus,
        dashboardAppearance: taskFoundInDashboard
      }
    };
    
  } catch (error) {
    console.error('💥 Unexpected error in addKnowledgeHubTasksAction:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return { 
      success: false, 
      error: "An unexpected error occurred while adding tasks. Check console for details.",
      details: {
        taskText: item.tasks?.[0]?.text || 'Unknown',
        priority: 'Unknown',
        userId,
        timestamp: new Date().toISOString(),
        verificationStatus: 'failed',
        dashboardAppearance: false
      }
    };
  }
}

// تحديد الأولوية بناءً على محتوى العنصر
function determinePriority(item: KnowledgeItem): 'high' | 'medium' | 'low' {
  const content = `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase();
  
  // أولوية عالية للأحداث القادمة والمواعيد النهائية
  if (/urgent|عاجل|deadline|موعد نهائي|emergency|طارئ/.test(content)) {
    return 'high';
  }
  
  // أولوية عالية للأحداث والمؤتمرات
  if (/event|حدث|فعالية|conference|مؤتمر|registration|تسجيل/.test(content)) {
    return 'high';
  }
  
  // أولوية متوسطة للمهام الأكاديمية والمشاريع
  if (/project|مشروع|assignment|واجب|study|دراسة/.test(content)) {
    return 'medium';
  }
  
  return 'medium';
}
