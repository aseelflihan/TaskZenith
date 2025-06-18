// D:\applications\tasks\TaskZenith\src\app\(app)\page.tsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TaskList } from "@/components/tasks/TaskList";
import { TaskTimer } from "@/components/tasks/TaskTimer";
import { AIPrioritization } from "@/components/tasks/AIPrioritization";
import { AIChatTaskGenerator } from "@/components/tasks/AIChatTaskGenerator";
import { TimelineClock } from "@/components/layout/TimelineClock";
import type { Task, SubTask, ActiveTimerTarget, TimerSessionType } from "@/lib/types";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { useToast } from "@/hooks/use-toast";
import { BellRing, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { parseISO, format, isValid, addMinutes, isSameDay, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getTasksForUser, addTask, updateTask, deleteTask } from "@/lib/actions";

const SCHEDULE_FOR_DATE_KEY = "taskzenith-schedule-for-date";

const calculateSubTaskActivityEndTime = (subtask: SubTask, startTime: Date): Date | null => {
  if (!isValid(startTime)) return null;
  const workDuration = subtask.durationMinutes || 0;
  const breakDuration = subtask.breakMinutes || 0;
  return addMinutes(startTime, workDuration + breakDuration);
};

const rescheduleSubsequentSubTasksOnActualTime = (
  allTasks: Task[],
  triggeringSubTaskId: string,
  triggeringSubTaskActualWorkEndTime: string
): Task[] => {
  let newTasksState = JSON.parse(JSON.stringify(allTasks)) as Task[];
  const triggeringSubTaskData = newTasksState.flatMap(t => t.subtasks).find(st => st.id === triggeringSubTaskId);
  if (!triggeringSubTaskData) return newTasksState;

  let lastActivityEndTime = addMinutes(new Date(triggeringSubTaskActualWorkEndTime), triggeringSubTaskData.breakMinutes || 0);
  const allSubTasksSorted = newTasksState
    .flatMap(task => task.subtasks.map(st => ({ ...st, parentTaskId: task.id })))
    .filter(st => st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)))
    .sort((a, b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime());

  let foundTriggeringSubTask = false;
  for (const subTaskToPotentiallyReschedule of allSubTasksSorted) {
    if (subTaskToPotentiallyReschedule.id === triggeringSubTaskId) {
      foundTriggeringSubTask = true;
      continue;
    }
    if (foundTriggeringSubTask && !subTaskToPotentiallyReschedule.completed) {
      const newScheduledStartTimeForThisSubtask = new Date(lastActivityEndTime);
      newTasksState = newTasksState.map(task => {
        if (task.id === subTaskToPotentiallyReschedule.parentTaskId) {
          return {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subTaskToPotentiallyReschedule.id
                ? {
                  ...st,
                  scheduledStartTime: newScheduledStartTimeForThisSubtask.toISOString(),
                  deadline: format(newScheduledStartTimeForThisSubtask, 'yyyy-MM-dd'),
                  scheduledTime: format(newScheduledStartTimeForThisSubtask, 'HH:mm'),
                }
                : st
            ),
          };
        }
        return task;
      });
      const duration = subTaskToPotentiallyReschedule.durationMinutes || 0;
      const breakTime = subTaskToPotentiallyReschedule.breakMinutes || 0;
      lastActivityEndTime = addMinutes(newScheduledStartTimeForThisSubtask, duration + breakTime);
    }
  }
  return newTasksState;
};

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTimerTarget, setActiveTimerTarget] = useState<ActiveTimerTarget | null>(null);
  const [currentSessionTypeForActiveTarget, setCurrentSessionTypeForActiveTarget] = useState<TimerSessionType>('work');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultDateForNewTask, setDefaultDateForNewTask] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // *** START: NEW CODE - Centralized function to refetch tasks ***
  const refetchTasks = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const userTasks = await getTasksForUser(session.user.id);
        setTasks(userTasks);
      } catch (error) {
        console.error("Error refetching tasks:", error);
        toast({
          title: "Error",
          description: "Could not sync tasks with the server.",
          variant: "destructive",
        });
      }
    }
  }, [session, toast]);
  // *** END: NEW CODE ***

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setIsLoading(true);
      refetchTasks().finally(() => setIsLoading(false));
    }
  }, [status, router, refetchTasks]);

  const handleFormOpenChange = (isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setEditingTask(null);
      setDefaultDateForNewTask(null);
    }
  };

  const handleOpenEditForm = (task: Task) => {
    setEditingTask(task);
    setDefaultDateForNewTask(null);
    setIsFormOpen(true);
  };
  
  const handleOpenNewTaskForm = () => {
    setEditingTask(null);
    try {
      const scheduleForDateISO = localStorage.getItem(SCHEDULE_FOR_DATE_KEY);
      if (scheduleForDateISO) {
        const parsedDate = parseISO(scheduleForDateISO);
        if (isValid(parsedDate)) setDefaultDateForNewTask(parsedDate);
        localStorage.removeItem(SCHEDULE_FOR_DATE_KEY);
      } else setDefaultDateForNewTask(null);
    } catch (e) { setDefaultDateForNewTask(null); }
    setIsFormOpen(true);
  };
  
  const handleAITasksGenerated = async (newTasksData: TaskFormData[]) => {
    if (!session?.user?.id) return;
    for (const taskData of newTasksData) {
      // We call addTask but don't need to await each one individually to update UI
      await addTask(session.user.id, taskData);
    }
    // After all tasks are added, do a single refetch to update the UI
    await refetchTasks();
    toast({
        title: "AI Tasks Added",
        description: `${newTasksData.length} new tasks have been added to your list.`,
    });
  };
  
  const handleAddTask = async (data: TaskFormData) => {
    if (!session?.user?.id) return;

    try {
      const result = await addTask(session.user.id, data);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      setIsFormOpen(false);
      toast({ title: "Success", description: "Task added successfully" });
      await refetchTasks(); // *** MODIFIED: Use refetchTasks instead of router.refresh()
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    }
  };

  const handleEditTask = async (data: TaskFormData) => {
    if (!session?.user?.id || !editingTask?.id) return;

    const subtasksToUpdate = data.subtasks.map(stFormData => {
      const existingSubTask = editingTask.subtasks.find(s => s.id === stFormData.id);
      return {
        ...(existingSubTask || {}),
        id: stFormData.id || crypto.randomUUID(),
        text: stFormData.text,
        completed: existingSubTask ? existingSubTask.completed : false,
        durationMinutes: stFormData.durationMinutes ?? 25,
        breakMinutes: stFormData.breakMinutes ?? 0,
        scheduledStartTime: ensureValidScheduledStartTime(stFormData),
        deadline: stFormData.deadline,
        scheduledTime: stFormData.scheduledTime,
      };
    });

    try {
      await updateTask(session.user.id, editingTask.id, {
        text: data.text,
        priority: data.priority,
        subtasks: subtasksToUpdate,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Task updated successfully." });
      await refetchTasks(); // *** MODIFIED: Use refetchTasks instead of router.refresh()
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
    } finally {
      handleFormOpenChange(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!session?.user?.id) return;

    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    const isCompleting = !taskToToggle.completed;
    const updatedSubtasks = taskToToggle.subtasks.map(st => ({
      ...st,
      completed: isCompleting,
      actualEndTime: isCompleting ? (st.actualEndTime || new Date().toISOString()) : undefined,
    }));

    let updatedTaskData: Partial<Task> = {
      completed: isCompleting,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };
    
    // Rescheduling logic can stay as it modifies state before sending to the server.
    // However, after a successful update, we should refetch to be sure.

    try {
      await updateTask(session.user.id, taskId, updatedTaskData);
      toast({ title: "Success", description: `Task ${isCompleting ? 'completed' : 'reopened'} successfully.` });
      await refetchTasks(); // *** MODIFIED: Use refetchTasks to get the authoritative state
    } catch (error) {
      console.error("Error toggling task:", error);
      toast({ title: "Error", description: "Failed to toggle task.", variant: "destructive" });
      // Optional: revert optimistic UI update on error, but refetching is simpler
    }

    if (activeTimerTarget?.parentTask.id === taskId && isCompleting) {
      setActiveTimerTarget(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    try {
      await deleteTask(session.user.id, taskId);
      toast({ title: "Success", description: "Task deleted successfully." });
      await refetchTasks(); // *** MODIFIED: Use refetchTasks for consistency
      if (activeTimerTarget?.parentTask.id === taskId) {
        setActiveTimerTarget(null);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  const handleUpdateSubTask = async (taskId: string, subtaskId: string, newText: string) => {
    if (!session?.user?.id) return;

    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;

    const updatedSubtasks = parentTask.subtasks.map(st =>
      st.id === subtaskId ? { ...st, text: newText } : st
    );

    try {
      await updateTask(session.user.id, taskId, {
        subtasks: updatedSubtasks,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Subtask updated successfully." });
      await refetchTasks(); // *** MODIFIED: Use refetchTasks
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast({ title: "Error", description: "Failed to update subtask.", variant: "destructive" });
    }
  };
  
  // NOTE: Operations that modify subtasks but are part of a larger workflow
  // (like ToggleSubTask or DeleteSubTask) might use optimistic updates for speed,
  // followed by a final updateTask call and a refetch. Let's make them consistent too.

  const handleDeleteSubTask = async (taskId: string, subtaskId: string) => {
    if (!session?.user?.id) return;
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;
    
    const updatedSubtasks = parentTask.subtasks.filter(st => st.id !== subtaskId);
    try {
      await updateTask(session.user.id, taskId, { subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
      toast({ title: "Success", description: "Subtask deleted." });
      await refetchTasks();
      if (activeTimerTarget?.data.id === subtaskId) {
        setActiveTimerTarget(null);
      }
    } catch (error) {
        console.error("Error deleting subtask:", error);
        toast({ title: "Error", description: "Failed to delete subtask.", variant: "destructive" });
    }
  };

  const handleToggleSubTask = async (taskId: string, subtaskId: string) => {
    if (!session?.user?.id) return;
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;

    const isCompleting = !parentTask.subtasks.find(st => st.id === subtaskId)?.completed;
    
    const updatedSubtasks = parentTask.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: isCompleting, actualEndTime: isCompleting ? new Date().toISOString() : undefined } : st
    );

    const allSubtasksNowCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);

    try {
        await updateTask(session.user.id, taskId, {
            subtasks: updatedSubtasks,
            completed: allSubtasksNowCompleted,
            updatedAt: new Date().toISOString(),
        });
        await refetchTasks(); // Refetch to get rescheduled tasks if any logic exists on the backend
        
        if (activeTimerTarget?.data.id === subtaskId && isCompleting) {
            setActiveTimerTarget(null);
        }
    } catch (error) {
        console.error("Error toggling subtask:", error);
        toast({ title: "Error", description: "Failed to toggle subtask.", variant: "destructive" });
    }
  };

  const handleTasksReorder = async (reorderedTasks: Task[]) => {
    // This is a client-side only reorder for now. To persist, you'd need a backend update.
    // For now, let's assume we want to save this new order.
    // This is complex and requires saving the `order` for each task.
    // For simplicity, we will just update the local state.
    // If persistence is needed, a new action `updateTasksOrder` would be required.
    setTasks(reorderedTasks);
  };
  
  // No changes needed below this line for the core problem, but kept for completeness
  const handleTimerComplete = () => {
    if (!activeTimerTarget || activeTimerTarget.type !== 'subtask') return;

    const endedSubTask = { ...activeTimerTarget.data };
    const parentTaskOfEndedSubTask = { ...activeTimerTarget.parentTask };
    const endedSessionType = currentSessionTypeForActiveTarget;
    const now = new Date();

    if (endedSessionType === 'work') {
        const workEndTime = now.toISOString();
        let tasksStateAfterCompletionAndReschedule = tasks;

        setTasks(prevTasks => {
            tasksStateAfterCompletionAndReschedule = prevTasks.map(task => {
                if (task.id === parentTaskOfEndedSubTask.id) {
                    const updatedSubtasks = task.subtasks.map(st =>
                        st.id === endedSubTask.id ? { ...st, completed: true, actualEndTime: workEndTime } : st
                    );
                    const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);
                    return { ...task, subtasks: updatedSubtasks, completed: allSubtasksCompleted };
                }
                return task;
            });

            return rescheduleSubsequentSubTasksOnActualTime(tasksStateAfterCompletionAndReschedule, endedSubTask.id, workEndTime);
        });


        const breakDuration = endedSubTask.breakMinutes || 0;
        if (breakDuration > 0) {
            setCurrentSessionTypeForActiveTarget('break');
            toast({
                title: `Work on "${endedSubTask.text}" done.`,
                description: `Starting ${breakDuration} min break.`,
                action: <div className="flex items-center"><BellRing className="h-5 w-5 mr-2 text-primary" /></div>
            });
        } else {
            setActiveTimerTarget(null);
            setCurrentSessionTypeForActiveTarget('work');
            toast({
                title: `Subtask "${endedSubTask.text}" completed!`,
                description: "Ready for the next task.",
                action: <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /></div>
            });
        }
    } else if (endedSessionType === 'break') {
        setActiveTimerTarget(null);
        setCurrentSessionTypeForActiveTarget('work');
        toast({
            title: `Break for "${endedSubTask.text}" finished.`,
            description: "Select your next task.",
            action: <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /></div>
        });
    }
  };

  const handleBreakManuallyEnded = () => {
    if (!activeTimerTarget || currentSessionTypeForActiveTarget !== 'break' || activeTimerTarget.type !== 'subtask') return;

    setActiveTimerTarget(null);
    setCurrentSessionTypeForActiveTarget('work');
    toast({
      title: `Break for "${activeTimerTarget.data.text}" ended.`,
      description: "Select your next task.",
      action: <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /></div>
    });
  };

  const startTimerForSubtask = (subtask: SubTask, parentTask: Task) => {
    const now = new Date();
    setTasks(prev => prev.map(t => {
      if (t.id === parentTask.id) {
        return {
          ...t,
          completed: false,
          subtasks: t.subtasks.map(st =>
            st.id === subtask.id
              ? { ...st, scheduledStartTime: now.toISOString(), deadline: format(now, 'yyyy-MM-dd'), scheduledTime: format(now, 'HH:mm'), completed: false, actualEndTime: undefined }
              : st
          )
        };
      }
      return t;
    }));

    const updatedTargetData = { ...subtask, scheduledStartTime: now.toISOString(), deadline: format(now, 'yyyy-MM-dd'), scheduledTime: format(now, 'HH:mm'), completed: false, actualEndTime: undefined };
    const updatedTarget: ActiveTimerTarget = { type: 'subtask', data: updatedTargetData, parentTask: parentTask };

    setActiveTimerTarget(updatedTarget);
    setCurrentSessionTypeForActiveTarget('work');
    toast({
      title: `Timer started for subtask: ${subtask.text}`,
      description: `Duration: ${subtask.durationMinutes || 25} min.`,
      action: <div className="flex items-center"><BellRing className="h-5 w-5 mr-2 text-primary" /></div>
    });
  };

  const handleTaskStartTimer = (task: Task) => {
    const firstIncompleteSubtask = task.subtasks.find(st => !st.completed && (st.durationMinutes || 0) > 0);
    if (firstIncompleteSubtask) {
      startTimerForSubtask(firstIncompleteSubtask, task);
    } else {
      toast({ title: "Cannot Start Timer", description: "No active, timed subtasks found for this task.", variant: "destructive" });
    }
  };

  const handleSubTaskStartTimer = (subtask: SubTask, parentTask: Task) => {
    if ((subtask.durationMinutes || 0) > 0) {
      startTimerForSubtask(subtask, parentTask);
    } else {
      toast({ title: "Cannot Start Timer", description: "Subtask has no duration specified.", variant: "destructive" });
    }
  };


  let formInitialData: TaskFormData | Partial<Task> | null = editingTask;
  if (!editingTask && defaultDateForNewTask) {
      formInitialData = {
          text: "",
          priority: "medium",
          subtasks: [{
              id: crypto.randomUUID(), text: "", completed: false,
              durationMinutes: 25, breakMinutes: 0,
              deadline: format(defaultDateForNewTask, 'yyyy-MM-dd'),
              scheduledTime: format(defaultDateForNewTask, 'HH:mm'),
          }]
      };
  } else if (!editingTask && !defaultDateForNewTask) {
      const now = new Date();
      formInitialData = {
          text: "", priority: "medium",
          subtasks: [{
              id: crypto.randomUUID(), text: "", completed: false,
              durationMinutes: 25, breakMinutes: 0,
              deadline: format(now, 'yyyy-MM-dd'),
              scheduledTime: format(now, 'HH:mm'),
          }]
      };
  }
  
  // Combined loading state for initial fetch and authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading tasks...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-xl mb-4">Please sign in to manage your tasks.</p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TaskList
            tasks={tasks}
            editingTask={editingTask}
            isFormOpen={isFormOpen}
            onFormOpenChange={handleFormOpenChange}
            onOpenEditForm={handleOpenEditForm}
            onOpenNewTaskForm={handleOpenNewTaskForm}
            initialDataForForm={formInitialData as TaskFormData | null}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onStartTimer={handleTaskStartTimer}
            onStartSubTaskTimer={handleSubTaskStartTimer}
            onUpdateSubTask={handleUpdateSubTask}
            onDeleteSubTask={handleDeleteSubTask}
            onToggleSubTask={handleToggleSubTask}
            onTasksReorder={handleTasksReorder}
            allTasks={tasks}
          />
        </div>
        <div className="space-y-8 lg:sticky lg:top-24 self-start">
          <TaskTimer
            activeTarget={activeTimerTarget}
            sessionType={currentSessionTypeForActiveTarget}
            onTimerComplete={handleTimerComplete}
            onBreakManuallyEnded={handleBreakManuallyEnded}
          />
          <AIPrioritization tasks={tasks} />
          <AIChatTaskGenerator 
            onTasksGenerated={handleAITasksGenerated} 
            existingTasks={tasks} 
          />
        </div>
      </div>
    </div>
  );
}

// دالة مساعدة لضبط scheduledStartTime بشكل صحيح
function ensureValidScheduledStartTime(subtask: any): string | undefined {
  if (subtask.scheduledStartTime && typeof subtask.scheduledStartTime === 'string') {
    const parsed = parseISO(subtask.scheduledStartTime);
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }
  if (subtask.deadline && subtask.scheduledTime) {
    const isoString = `${subtask.deadline}T${subtask.scheduledTime}:00`;
    const parsed = parseISO(isoString);
    if (isValid(parsed)) return parsed.toISOString();
  }
  return undefined;
}