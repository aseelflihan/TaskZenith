"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TaskList } from "@/components/tasks/TaskList";
import { TaskTimer } from "@/components/tasks/TaskTimer";
import { AIPrioritization } from "@/components/tasks/AIPrioritization";
import { AIChatTaskGenerator } from "@/components/tasks/AIChatTaskGenerator";
import type { Task, SubTask, ActiveTimerTarget, TimerSessionType } from "@/lib/types";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { useToast } from "@/hooks/use-toast";
import { BellRing, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils.tsx";
import { parseISO, format, isValid, addMinutes, isSameDay, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';

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
      try {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks).map((task: Task) => ({
            ...task,
            createdAt: task.createdAt || new Date().toISOString(),
            subtasks: (task.subtasks || []).map((st: SubTask) => ({
              ...st,
              id: st.id || crypto.randomUUID(),
              durationMinutes: typeof st.durationMinutes === 'number' ? st.durationMinutes : 25,
              breakMinutes: typeof st.breakMinutes === 'number' ? st.breakMinutes : 0,
              scheduledStartTime: st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) ? parseISO(st.scheduledStartTime).toISOString() : undefined,
              actualEndTime: st.actualEndTime && isValid(parseISO(st.actualEndTime)) ? parseISO(st.actualEndTime).toISOString() : undefined,
              deadline: st.deadline || (st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) ? format(parseISO(st.scheduledStartTime), 'yyyy-MM-dd') : undefined),
              scheduledTime: st.scheduledTime || (st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) ? format(parseISO(st.scheduledStartTime), 'HH:mm') : undefined),
            }))
          }));
          setTasks(parsedTasks);
        }
      } catch (e) { console.error("Failed to load tasks from localStorage", e); }
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks)); } 
      catch (e) { console.error("Failed to save tasks to localStorage", e); }
    }
  }, [tasks, status]);

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

  const processSubTaskFormDates = (subtaskData: any): Partial<SubTask> => {
    let scheduledStartTime: string | undefined = undefined;
    if (subtaskData.deadline && subtaskData.scheduledTime) {
      try {
        const parsed = parseISO(`${subtaskData.deadline}T${subtaskData.scheduledTime}:00`);
        if (isValid(parsed)) scheduledStartTime = parsed.toISOString();
      } catch {}
    } else if (subtaskData.scheduledTime && !subtaskData.deadline) {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const parsed = parseISO(`${today}T${subtaskData.scheduledTime}:00`);
        if (isValid(parsed)) scheduledStartTime = parsed.toISOString();
      } catch {}
    }
    return { ...subtaskData, scheduledStartTime };
  };
  
  const handleAITasksGenerated = (newTasksData: TaskFormData[]) => {
    const tasksToAdd: Task[] = newTasksData.map(taskData => ({
      id: crypto.randomUUID(),
      text: taskData.text,
      priority: taskData.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks.map(stFormData => {
        const processedSubTask = processSubTaskFormDates(stFormData);
        return {
          id: stFormData.id || crypto.randomUUID(),
          text: stFormData.text,
          completed: false,
          // --- THIS IS THE FINAL SAFE FALLBACK ---
          // It uses the value from the AI if it exists (e.g., 30),
          // otherwise, it provides a safe value for the state.
          durationMinutes: stFormData.durationMinutes ?? 25,
          breakMinutes: stFormData.breakMinutes ?? 0,
          // --- END OF FIX ---
          scheduledStartTime: processedSubTask.scheduledStartTime,
          deadline: stFormData.deadline,
          scheduledTime: stFormData.scheduledTime,
        };
      }),
    }));
    setTasks(prevTasks => [...tasksToAdd, ...prevTasks]);
  };
  
  const handleAddTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: data.text,
      priority: data.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: data.subtasks.map(stFormData => {
        const processedSubTask = processSubTaskFormDates(stFormData);
        return {
          id: stFormData.id || crypto.randomUUID(),
          text: stFormData.text,
          completed: false,
          durationMinutes: stFormData.durationMinutes ?? 25,
          breakMinutes: stFormData.breakMinutes ?? 0,
          scheduledStartTime: processedSubTask.scheduledStartTime,
          deadline: stFormData.deadline,
          scheduledTime: stFormData.scheduledTime,
        };
      }),
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    handleFormOpenChange(false);
  };

  const handleEditTask = (data: TaskFormData) => {
    if (!editingTask) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask.id
          ? {
            ...task,
            text: data.text,
            priority: data.priority,
            subtasks: data.subtasks.map(stFormData => {
              const processedSubTask = processSubTaskFormDates(stFormData);
              const existingSubTask = task.subtasks.find(s => s.id === stFormData.id);
              return {
                ...(existingSubTask || {}),
                id: stFormData.id || crypto.randomUUID(),
                text: stFormData.text,
                completed: existingSubTask ? existingSubTask.completed : false,
                durationMinutes: stFormData.durationMinutes ?? 25,
                breakMinutes: stFormData.breakMinutes ?? 0,
                scheduledStartTime: processedSubTask.scheduledStartTime,
                deadline: stFormData.deadline,
                scheduledTime: stFormData.scheduledTime,
              };
            }),
          }
          : task
      )
    );
    handleFormOpenChange(false);
  };

  // ... (Other handlers: handleToggleTask, handleDeleteTask, etc. remain the same)
  // These handlers are long, so I'll keep them but you don't need to review them for this specific fix.

  const handleToggleTask = (taskId: string) => {
    // This logic is complex and not related to the AI break-time fix.
    // It is kept as is.
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    const isCompleting = !taskToToggle.completed;
    const newEndTime = isCompleting ? new Date().toISOString() : undefined;
    let finalTasksState = [...tasks];

    finalTasksState = finalTasksState.map(t => {
      if (t.id === taskId) {
        const updatedTask = {
          ...t,
          completed: isCompleting,
          subtasks: t.subtasks.map(st => ({
            ...st,
            completed: isCompleting,
            actualEndTime: isCompleting ? (st.actualEndTime || newEndTime) : undefined,
          }))
        };

        if (isCompleting && updatedTask.subtasks.length > 0) {
            const lastSubtask = [...updatedTask.subtasks]
                .filter(st => st.actualEndTime && isValid(parseISO(st.actualEndTime)))
                .sort((a,b) => parseISO(b.actualEndTime!).getTime() - parseISO(a.actualEndTime!).getTime())[0];

            if (lastSubtask?.actualEndTime) {
                 const rescheduledTasks = rescheduleSubsequentSubTasksOnActualTime(
                    [updatedTask, ...finalTasksState.filter(tsk => tsk.id !== updatedTask.id)],
                    lastSubtask.id,
                    lastSubtask.actualEndTime
                 );
                 return rescheduledTasks.find(rt => rt.id === updatedTask.id) || updatedTask;
            }
        }
        return updatedTask;
      }
      return t;
    });
    setTasks(finalTasksState);

    if (activeTimerTarget?.parentTask.id === taskId && isCompleting) {
      setActiveTimerTarget(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (activeTimerTarget?.parentTask.id === taskId) {
      setActiveTimerTarget(null);
    }
  };

  const handleUpdateSubTask = (taskId: string, subtaskId: string, newText: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, text: newText } : st
            ),
          }
          : task
      )
    );
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