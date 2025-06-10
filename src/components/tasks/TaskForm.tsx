
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Save, X } from "lucide-react";
import type { Task, SubTask as SubTaskType } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { addMinutes, parseISO, areIntervalsOverlapping, format, isValid, isSameDay } from 'date-fns';

// Helper function moved outside or wrapped in useCallback if inside component
const getSubTaskTimes = (
  deadline: string | undefined,
  scheduledTime: string | undefined,
  durationMinutes: number | undefined,
  breakMinutes: number | undefined
): { workStartTime: Date; workEndTime: Date; activityEndTime: Date } | null => {
  if (!deadline || !scheduledTime || typeof durationMinutes !== 'number' || durationMinutes < 0) {
    return null;
  }
  const timeParts = scheduledTime.split(':');
  if (timeParts.length !== 2) return null;

  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  const formattedScheduledTime = String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0');

  try {
    const workStartDateTime = parseISO(deadline + "T" + formattedScheduledTime + ":00");
    if (!isValid(workStartDateTime)) return null;

    const workEndDateTime = addMinutes(workStartDateTime, durationMinutes);
    const currentBreakMinutes = typeof breakMinutes === 'number' && breakMinutes > 0 ? breakMinutes : 0;
    const activityEndTime = addMinutes(workEndDateTime, currentBreakMinutes);
    
    return {
      workStartTime: workStartDateTime,
      workEndTime: workEndDateTime,
      activityEndTime: activityEndDateTime,
    };
  } catch (e) {
    return null;
  }
};


const subTaskSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Subtask text cannot be empty."),
  completed: z.boolean().default(false),
  durationMinutes: z.coerce.number().min(0, "Duration must be a non-negative number.").default(25),
  breakMinutes: z.coerce.number().min(0, "Break time must be a non-negative number.").default(0),
  deadline: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Date must be in YYYY-MM-DD format or empty.",
  }),
  scheduledTime: z.string().optional().refine(val => !val || /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
    message: "Time must be in HH:MM format (e.g., 09:30 or 14:00) or empty.",
  }),
}).refine(data => {
  if (data.deadline && !data.scheduledTime) {
    return true; 
  }
  if (!data.deadline && data.scheduledTime) {
     try { 
      const timeParts = data.scheduledTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    } catch {
      return false;
    }
  }
  if (data.deadline && data.scheduledTime) {
    try {
      const testDate = parseISO(data.deadline + "T" + data.scheduledTime + ":00");
      return isValid(testDate);
    } catch {
      return false;
    }
  }
  return true; 
}, {
  message: "If date and time are provided, they must be valid. Date or time can be provided alone.",
  path: ["scheduledTime"], 
});


const taskFormSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Task text cannot be empty."),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  subtasks: z.array(subTaskSchema).default([]),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<Task> | TaskFormData | null;
  isEditing?: boolean;
  allTasks: Task[];
}

export function TaskForm({ onSubmit, onCancel, initialData, isEditing = false, allTasks }: TaskFormProps) {
  const [conflictingSubTasksInfo, setConflictingSubTasksInfo] = useState<{ subTaskIndex: number, message: string }[]>([]);
  const initialRender = useRef(true);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      text: initialData?.text || "",
      priority: (initialData as Task)?.priority || (initialData as TaskFormData)?.priority || "medium",
      subtasks: (initialData?.subtasks || []).map(st => ({
        id: st.id || crypto.randomUUID(),
        text: st.text || "",
        completed: st.completed || false,
        durationMinutes: st.durationMinutes === undefined ? 25 : st.durationMinutes,
        breakMinutes: st.breakMinutes === undefined ? 0 : st.breakMinutes,
        deadline: st.deadline || ((st as SubTaskType).scheduledStartTime && isValid(parseISO((st as SubTaskType).scheduledStartTime!)) ? format(parseISO((st as SubTaskType).scheduledStartTime!), 'yyyy-MM-dd') : undefined),
        scheduledTime: st.scheduledTime || ((st as SubTaskType).scheduledStartTime && isValid(parseISO((st as SubTaskType).scheduledStartTime!)) ? format(parseISO((st as SubTaskType).scheduledStartTime!), 'HH:mm') : undefined),
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const watchedSubtasks = form.watch('subtasks');

  const checkConflicts = useCallback((currentFormData: TaskFormData) => {
    const newConflicts: { subTaskIndex: number, message: string }[] = [];
    const formSubTasks = currentFormData.subtasks || [];

    for (let i = 0; i < formSubTasks.length; i++) {
      const currentSubTaskData = formSubTasks[i];
      const currentTimes = getSubTaskTimes(
          currentSubTaskData.deadline, 
          currentSubTaskData.scheduledTime, 
          currentSubTaskData.durationMinutes, 
          currentSubTaskData.breakMinutes
      );
      if (!currentTimes) continue;

      // 1. Check for sequential conflicts within the form (should be prevented by auto-fill and min attributes)
      if (i > 0) {
        const prevSubTaskData = formSubTasks[i-1];
        const prevTimes = getSubTaskTimes(
            prevSubTaskData.deadline, 
            prevSubTaskData.scheduledTime, 
            prevSubTaskData.durationMinutes, 
            prevSubTaskData.breakMinutes
        );
        if (prevTimes && prevTimes.activityEndTime > currentTimes.workStartTime) {
          // This case should ideally be rare due to auto-sequencing
          newConflicts.push({ subTaskIndex: i, message: `Sequencing error with previous subtask.` });
          continue; // If there's a sequencing error, prioritize fixing that
        }
      }
      
      // 2. Check for overlap with other subtasks in the same form (non-sequential)
      for (let j = 0; j < formSubTasks.length; j++) {
        if (i === j) continue; 

        const otherFormSubTask = formSubTasks[j];
        const otherTimes = getSubTaskTimes(
            otherFormSubTask.deadline, 
            otherFormSubTask.scheduledTime, 
            otherFormSubTask.durationMinutes, 
            otherFormSubTask.breakMinutes
        );
        if (otherTimes && areIntervalsOverlapping(
          { start: currentTimes.workStartTime, end: currentTimes.workEndTime },
          { start: otherTimes.workStartTime, end: otherTimes.workEndTime },
          { inclusive: false } 
        )) {
          if (!newConflicts.some(c => c.subTaskIndex === i)) { // Add conflict only once per subtask
            newConflicts.push({ subTaskIndex: i, message: `Overlaps with "${otherFormSubTask.text || `Subtask ${j + 1}`}" (in this form).` });
          }
          break; 
        }
      }
      if (newConflicts.some(c => c.subTaskIndex === i)) continue;

      // 3. Check for overlap with existing tasks in the system
      const mainTaskIdBeingEdited = currentFormData.id;

      for (const existingTask of allTasks) {
        for (const existingSubTask of existingTask.subtasks) {
          if (mainTaskIdBeingEdited && existingTask.id === mainTaskIdBeingEdited && currentSubTaskData.id && existingSubTask.id === currentSubTaskData.id) {
            continue; // Don't compare an editing subtask with its original self in allTasks
          }

          const existingSubTaskTimes = getSubTaskTimes(
              existingSubTask.deadline, 
              existingSubTask.scheduledTime, 
              existingSubTask.durationMinutes, 
              existingSubTask.breakMinutes
          );
          if (existingSubTaskTimes && areIntervalsOverlapping(
            { start: currentTimes.workStartTime, end: currentTimes.workEndTime },
            { start: existingSubTaskTimes.workStartTime, end: existingSubTaskTimes.workEndTime },
            { inclusive: false }
          )) {
             if (!newConflicts.some(c => c.subTaskIndex === i)) {
                newConflicts.push({ subTaskIndex: i, message: `Overlaps with existing: "${existingSubTask.text}" (from task "${existingTask.text}").` });
             }
            break; 
          }
        }
        if (newConflicts.some(c => c.subTaskIndex === i)) break; 
      }
    }
    setConflictingSubTasksInfo(newConflicts);
    return newConflicts;
  }, [allTasks, form]); 

 useEffect(() => {
    const currentFormData = form.getValues();
    let processedSubtasks = [...(currentFormData.subtasks || [])];
    let madeChanges = false;
    let latestActivityEndTimeFromPreviousSubtask: Date | null = null;

    if (processedSubtasks.length > 0) {
        // Process the first subtask to establish the initial latestActivityEndTimeFromPreviousSubtask
        const firstSubtaskData = processedSubtasks[0];
        const firstSubtaskTimes = getSubTaskTimes(
            firstSubtaskData.deadline,
            firstSubtaskData.scheduledTime,
            firstSubtaskData.durationMinutes,
            firstSubtaskData.breakMinutes
        );
        latestActivityEndTimeFromPreviousSubtask = firstSubtaskTimes?.activityEndTime || null;

        // Iterate from the second subtask
        for (let i = 1; i < processedSubtasks.length; i++) {
            const currentSubtask = { ...processedSubtasks[i] }; // Work with a copy

            if (latestActivityEndTimeFromPreviousSubtask) {
                const expectedStartTimeForCurrent = latestActivityEndTimeFromPreviousSubtask;
                const expectedDeadline = format(expectedStartTimeForCurrent, 'yyyy-MM-dd');
                const expectedScheduledTime = format(expectedStartTimeForCurrent, 'HH:mm');

                let userManuallySetStartTime: Date | null = null;
                if (currentSubtask.deadline && currentSubtask.scheduledTime) {
                    try {
                        userManuallySetStartTime = parseISO(`${currentSubtask.deadline}T${currentSubtask.scheduledTime}:00`);
                    } catch { /* ignore parse error */ }
                }
                
                let shouldUpdateCascadedTime = false;
                if (!userManuallySetStartTime || !isValid(userManuallySetStartTime) || userManuallySetStartTime < expectedStartTimeForCurrent) {
                    shouldUpdateCascadedTime = true;
                }

                if (shouldUpdateCascadedTime) {
                    if (currentSubtask.deadline !== expectedDeadline || currentSubtask.scheduledTime !== expectedScheduledTime) {
                        currentSubtask.deadline = expectedDeadline;
                        currentSubtask.scheduledTime = expectedScheduledTime;
                        processedSubtasks[i] = currentSubtask; // Update the array
                        madeChanges = true;
                    }
                }
            }
            // Update latestActivityEndTimeFromPreviousSubtask for the next iteration
            const currentTimes = getSubTaskTimes(
                currentSubtask.deadline,
                currentSubtask.scheduledTime,
                currentSubtask.durationMinutes,
                currentSubtask.breakMinutes
            );
            latestActivityEndTimeFromPreviousSubtask = currentTimes?.activityEndTime || null;
        }
    }

    if (madeChanges) {
        form.setValue('subtasks', processedSubtasks, { shouldValidate: false, shouldDirty: true });
        form.trigger('subtasks').then(() => checkConflicts(form.getValues()));
    } else if (!initialRender.current) {
        checkConflicts(currentFormData);
    }
    
    if (initialRender.current) {
        checkConflicts(currentFormData); // Check conflicts on initial load
        initialRender.current = false;
    }

}, [watchedSubtasks, form, checkConflicts]);


  const handleFormSubmit = (data: TaskFormData) => {
    const finalConflicts = checkConflicts(data); 
    if (finalConflicts.length > 0) {
      // This state should ideally not be reachable with auto-correction.
      // If it is, it means there's a conflict type not handled by auto-correction (e.g., overlap with existing tasks).
      console.error("Submission blocked due to unresolved conflicts:", finalConflicts);
      // Optionally, re-display a generic conflict message or specific messages from finalConflicts
      return; 
    }
    onSubmit(data);
    if (!isEditing) { 
      form.reset({
        text: "",
        priority: "medium",
        subtasks: [{
            id: crypto.randomUUID(),
            text: "",
            completed: false,
            durationMinutes: 25,
            breakMinutes: 0,
            deadline: format(new Date(), 'yyyy-MM-dd'),
            scheduledTime: format(new Date(), 'HH:mm'),
        }],
      });
    }
  };

  const hasConflicts = conflictingSubTasksInfo.length > 0;
  
  const formTitle = isEditing 
    ? "Edit Task" 
    : (initialData && (initialData as TaskFormData).text && (initialData as TaskFormData).subtasks?.length && !(initialData as Task).createdAt) // AI data from generator
      ? "Review & Add AI Generated Task" 
      : (initialData && (initialData as TaskFormData).subtasks && (initialData as TaskFormData).subtasks![0]?.deadline && (initialData as TaskFormData).subtasks![0]?.scheduledTime) // From timeline "add for date"
        ? `New Task for ${format(parseISO((initialData as TaskFormData).subtasks![0].deadline + "T" + (initialData as TaskFormData).subtasks![0].scheduledTime + ":00"), 'MMM d, h:mm a')}`
        : "Create New Task";

  return (
    <Card className="w-full shadow-lg flex flex-col flex-grow min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle>{formTitle}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
         <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description (Main Task Title)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter main task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Task Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "medium"} defaultValue="medium">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-lg font-semibold mb-2 block">Subtasks</FormLabel>
              {fields.map((field, index) => {
                let minDateForCurrentSubtask: string | undefined = undefined;
                let minTimeForCurrentSubtask: string | undefined = undefined;

                if (index > 0) {
                  const prevSubtaskData = form.getValues(`subtasks.${index - 1}`);
                  const prevTimes = getSubTaskTimes(
                    prevSubtaskData.deadline,
                    prevSubtaskData.scheduledTime,
                    prevSubtaskData.durationMinutes,
                    prevSubtaskData.breakMinutes
                  );
                  if (prevTimes?.activityEndTime && isValid(prevTimes.activityEndTime)) {
                    minDateForCurrentSubtask = format(prevTimes.activityEndTime, 'yyyy-MM-dd');
                    const currentSubtaskDateFieldValue = form.getValues(`subtasks.${index}.deadline`);
                    if (currentSubtaskDateFieldValue === minDateForCurrentSubtask) {
                      minTimeForCurrentSubtask = format(prevTimes.activityEndTime, 'HH:mm');
                    }
                  }
                }

                return (
                  <Card key={field.id} className="mb-4 p-4 border shadow-sm bg-muted/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-md">Subtask {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label={`Remove subtask ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.text`}
                        render={({ field: subField }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder={`Subtask ${index + 1} description`} {...subField} aria-label={`Subtask ${index + 1} description`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`subtasks.${index}.durationMinutes`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Duration (min)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 25" {...subField} aria-label={`Subtask ${index + 1} duration`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`subtasks.${index}.breakMinutes`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Break After (min)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 5" {...subField} aria-label={`Subtask ${index + 1} break`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`subtasks.${index}.deadline`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...subField}
                                  value={subField.value || ''}
                                  min={minDateForCurrentSubtask}
                                  aria-label={`Subtask ${index + 1} date`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`subtasks.${index}.scheduledTime`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...subField}
                                  value={subField.value || ''}
                                  min={minTimeForCurrentSubtask}
                                  aria-label={`Subtask ${index + 1} start time`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Removed individual subtask conflict Alert, conflicts are handled by disabling submit */}
                    </div>
                  </Card>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const newSubtaskId = crypto.randomUUID();
                  const currentSubtasksValues = form.getValues('subtasks') || [];
                  let newDeadlineStr: string | undefined = format(new Date(), 'yyyy-MM-dd'); 
                  let newScheduledTimeStr: string | undefined = format(new Date(), 'HH:mm');
                  let defaultDuration = 25;
                  let defaultBreak = 0;

                  if (currentSubtasksValues.length > 0) {
                    const lastSubtaskData = form.getValues(`subtasks.${currentSubtasksValues.length - 1}`);
                    const lastSubtaskTimes = getSubTaskTimes(
                      lastSubtaskData.deadline,
                      lastSubtaskData.scheduledTime,
                      lastSubtaskData.durationMinutes,
                      lastSubtaskData.breakMinutes
                    );
                    if (lastSubtaskTimes?.activityEndTime && isValid(lastSubtaskTimes.activityEndTime)) {
                      newDeadlineStr = format(lastSubtaskTimes.activityEndTime, 'yyyy-MM-dd');
                      newScheduledTimeStr = format(lastSubtaskTimes.activityEndTime, 'HH:mm');
                    } else { // Fallback if last subtask time calculation fails
                      newDeadlineStr = lastSubtaskData.deadline || format(new Date(), 'yyyy-MM-dd');
                      const lastTime = lastSubtaskData.scheduledTime;
                      if (lastTime && newDeadlineStr) {
                          try {
                              const tempDate = parseISO(newDeadlineStr + "T" + lastTime + ":00");
                              newScheduledTimeStr = format(addMinutes(tempDate, (lastSubtaskData.durationMinutes ?? defaultDuration) + (lastSubtaskData.breakMinutes ?? defaultBreak)), 'HH:mm');
                          } catch {
                              newScheduledTimeStr = format(new Date(), 'HH:mm'); 
                          }
                      } else {
                          newScheduledTimeStr = format(new Date(), 'HH:mm'); 
                      }
                    }
                  } else if (initialData && (initialData as TaskFormData).subtasks && (initialData as TaskFormData).subtasks![0]) {
                     const firstSubtaskInitial = (initialData as TaskFormData).subtasks![0];
                     newDeadlineStr = firstSubtaskInitial.deadline || format(new Date(), 'yyyy-MM-dd');
                     newScheduledTimeStr = firstSubtaskInitial.scheduledTime || format(new Date(), 'HH:mm');
                     defaultDuration = firstSubtaskInitial.durationMinutes ?? 25;
                     defaultBreak = firstSubtaskInitial.breakMinutes ?? 0;
                  }

                  append({
                    id: newSubtaskId,
                    text: "",
                    completed: false,
                    durationMinutes: defaultDuration,
                    breakMinutes: defaultBreak,
                    deadline: newDeadlineStr,
                    scheduledTime: newScheduledTimeStr,
                  });
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Subtask
              </Button>
            </div>
          </div>
          <CardFooter className="flex justify-end gap-2 border-t p-6 flex-shrink-0">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
            <Button type="submit" disabled={hasConflicts}>
              <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Add Task"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
