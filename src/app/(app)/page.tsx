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

const LOCAL_STORAGE_KEY = "taskzenith-tasks";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTimerTarget, setActiveTimerTarget] = useState<ActiveTimerTarget | null>(null);
  const [currentSessionTypeForActiveTarget, setCurrentSessionTypeForActiveTarget] = useState<TimerSessionType>('work');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultDateForNewTask, setDefaultDateForNewTask] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    else if (status === 'authenticated') {
      const fetchTasks = async () => {
        if (session?.user?.id) {
          try {
            const userTasks = await getTasksForUser(session.user.id);
            setTasks(userTasks);
          } catch (error) {
            console.error("Error fetching tasks:", error);
          }
        }
      };
      fetchTasks();
    }
  }, [status, router, session]);

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

  // تعديل: حفظ مهام الذكاء الاصطناعي في قاعدة البيانات للمستخدم
  const handleAITasksGenerated = async (newTasksData: TaskFormData[]) => {
    if (!session?.user?.id) return;
    for (const taskData of newTasksData) {
      await addTask(session.user.id, taskData);
    }
    const updatedTasks = await getTasksForUser(session.user.id);
    setTasks(updatedTasks);
    // Removed localStorage.setItem as data is now persisted to DB and re-fetched
  };
  
  const handleAddTask = async (data: TaskFormData) => {
    if (!session?.user?.id) return;

    // Ensure proper scheduling for new tasks
    const currentDate = new Date();
    const subtasksWithSchedule = data.subtasks.map((subtask, index) => {
      // Check if deadline AND scheduledTime are missing, then set default schedule
      if (!subtask.deadline || !subtask.scheduledTime) {
        // If no schedule, set it to current time plus 30 minutes * index
        const scheduledTime = addMinutes(currentDate, 30 * (index + 1));
        return {
          ...subtask,
          scheduledStartTime: scheduledTime.toISOString(),
          deadline: format(scheduledTime, 'yyyy-MM-dd'),
          scheduledTime: format(scheduledTime, 'HH:mm'),
        };
      }
      return subtask;
    });

    const taskDataWithSchedule = {
      ...data,
      subtasks: subtasksWithSchedule,
    };

    try {
      console.log("Adding task with schedule:", taskDataWithSchedule); // للتحقق
      const result = await addTask(session.user.id, taskDataWithSchedule);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Task added successfully",
      });
      router.refresh(); // Trigger a refresh of the current route
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
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
      router.refresh(); // Trigger a refresh of the current route
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
    const newEndTime = isCompleting ? new Date().toISOString() : undefined;

    const updatedSubtasks = taskToToggle.subtasks.map(st => ({
      ...st,
      completed: isCompleting,
      actualEndTime: isCompleting ? (st.actualEndTime || newEndTime) : undefined,
    }));

    let updatedTaskData: Partial<Task> = {
      completed: isCompleting,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };

    if (isCompleting && updatedSubtasks.length > 0) {
      const lastSubtask = [...updatedSubtasks]
        .filter(st => st.actualEndTime && isValid(parseISO(st.actualEndTime)))
        .sort((a, b) => parseISO(b.actualEndTime!).getTime() - parseISO(a.actualEndTime!).getTime())[0];

      if (lastSubtask?.actualEndTime) {
        const tempTasksForReschedule = tasks.map(t => t.id === taskId ? { ...taskToToggle, ...updatedTaskData } as Task : t);
        const rescheduledTasks = rescheduleSubsequentSubTasksOnActualTime(
          tempTasksForReschedule,
          lastSubtask.id,
          lastSubtask.actualEndTime
        );
        const taskAfterReschedule = rescheduledTasks.find(rt => rt.id === taskId);
        if (taskAfterReschedule) {
          updatedTaskData.subtasks = taskAfterReschedule.subtasks;
        }
      }
    }

    try {
      await updateTask(session.user.id, taskId, updatedTaskData);
      const updatedTasks = await getTasksForUser(session.user.id);
      setTasks(updatedTasks);
      toast({ title: "Success", description: `Task ${isCompleting ? 'completed' : 'reopened'} successfully.` });
    } catch (error) {
      console.error("Error toggling task:", error);
      toast({ title: "Error", description: "Failed to toggle task.", variant: "destructive" });
    }

    if (activeTimerTarget?.parentTask.id === taskId && isCompleting) {
      setActiveTimerTarget(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    await deleteTask(session.user.id, taskId);
    const updatedTasks = await getTasksForUser(session.user.id);
    setTasks(updatedTasks);
    if (activeTimerTarget?.parentTask.id === taskId) {
      setActiveTimerTarget(null);
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
      const updatedTasks = await getTasksForUser(session.user.id);
      setTasks(updatedTasks);
      toast({ title: "Success", description: "Subtask updated successfully." });
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast({ title: "Error", description: "Failed to update subtask.", variant: "destructive" });
    }
  };

  const handleDeleteSubTask = (taskId: string, subtaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
          const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: updatedSubtasks.length === 0 ? task.completed : allSubtasksCompleted,
          };
        }
        return task;
      })
    );
    if (activeTimerTarget?.data.id === subtaskId) {
      setActiveTimerTarget(null);
    }
  };

  const handleToggleSubTask = (taskId: string, subtaskId: string) => {
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;
    const subtaskToToggle = parentTask.subtasks.find(st => st.id === subtaskId);
    if (!subtaskToToggle) return;

    const isCompleting = !subtaskToToggle.completed;
    const workEndTime = isCompleting ? new Date().toISOString() : undefined;

    setTasks(prevTasks => {
      let tasksAfterToggle = prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: isCompleting, actualEndTime: workEndTime } : st
          );
          const allSubtasksNowCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allSubtasksNowCompleted
          };
        }
        return task;
      });

      if (isCompleting) {
        if (activeTimerTarget?.data.id !== subtaskId || currentSessionTypeForActiveTarget !== 'work') {
          tasksAfterToggle = rescheduleSubsequentSubTasksOnActualTime(tasksAfterToggle, subtaskId, workEndTime!);
        }
      } else {
        tasksAfterToggle = tasksAfterToggle.map(t => t.id === taskId ? { ...t, completed: false } : t);
      }
      return tasksAfterToggle;
    });


    if (activeTimerTarget?.data.id === subtaskId && isCompleting) {
      setActiveTimerTarget(null);
    }
  };


  const handleTasksReorder = (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks);
  };

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

  if (status === "loading") {
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
          <TimelineClock tasks={tasks} />
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
  console.log('--- ensureValidScheduledStartTime ---');
  console.log('input subtask:', subtask);

  // If scheduledStartTime is already a valid ISO string, use it.
  if (subtask.scheduledStartTime && typeof subtask.scheduledStartTime === 'string') {
    const parsed = parseISO(subtask.scheduledStartTime);
    if (isValid(parsed)) {
      console.log('valid ISO scheduledStartTime:', subtask.scheduledStartTime);
      return parsed.toISOString();
    }
  }

  // If deadline and scheduledTime are provided (expected format: YYYY-MM-DD and HH:mm)
  if (subtask.deadline && subtask.scheduledTime) {
    const isoString = `${subtask.deadline}T${subtask.scheduledTime}:00`;
    const parsed = parseISO(isoString);
    console.log('parsed from deadline/scheduledTime:', { deadline: subtask.deadline, scheduledTime: subtask.scheduledTime, isoString, isValid: isValid(parsed) });
    if (isValid(parsed)) return parsed.toISOString();
  }

  console.log('returning undefined');
  return undefined;
}
