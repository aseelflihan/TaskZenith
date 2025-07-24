"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    // إنشاء مهمة رئيسية مع عنوان محسن
    const isEvent = item.tags.some(tag => 
      /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp/i.test(tag)
    );
    
    const mainTaskText = isEvent 
      ? `حدث: ${item.title}`
      : `معالجة: ${item.title}`;

    // تحويل المهام المستخرجة إلى مهام فرعية مع تحسينات
    const subtasks = item.tasks.map(task => {
      const enhancedTask = task as any; // للوصول للخصائص المحسنة
      
      return {
        id: crypto.randomUUID(),
        text: enhancedTask.text || task.text,
        completed: false,
        durationMinutes: enhancedTask.durationMinutes || 25,
        breakMinutes: 5,
        deadline: enhancedTask.deadline,
        scheduledTime: enhancedTask.deadline ? calculateScheduledTime(enhancedTask.deadline) : undefined,
      };
    });

    const taskData: TaskFormData = {
      text: mainTaskText,
      priority: determinePriority(item),
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

// حساب وقت مجدول بناءً على الموعد النهائي
function calculateScheduledTime(deadline: string): string | undefined {
  try {
    const deadlineDate = new Date(deadline);
    // جدولة المهمة قبل يوم من الموعد النهائي
    const scheduledDate = new Date(deadlineDate);
    scheduledDate.setDate(scheduledDate.getDate() - 1);
    scheduledDate.setHours(10, 0, 0, 0); // 10:00 AM
    
    return scheduledDate.toISOString();
  } catch (error) {
    return undefined;
  }
}