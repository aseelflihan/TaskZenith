"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sun, Moon, CalendarDays, CheckCircle, Zap, Clock, Briefcase, Coffee as CoffeeIcon, Info, ListChecks, CheckSquare, ChevronLeft, ChevronRight, PlusCircle, CalendarClock } from 'lucide-react';
import { 
  setHours as dateFnsSetHours, 
  subDays, 
  addDays, 
  startOfDay, 
  endOfDay, 
  eachHourOfInterval, 
  addMinutes, 
  differenceInMinutes, 
  isValid, 
  parseISO, 
  format, 
  isSameDay, 
  getHours, 
  getMinutes, 
  isAfter, 
  setMinutes, 
  setSeconds, 
  setMilliseconds,
  parse
} from 'date-fns';
// Removed AnalogClockIcon import
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Task, SubTask } from "@/lib/types";
import { formatTimelineTime, getTimelineDayNightIcon, cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";


interface EnrichedSubTask extends SubTask {
  parentTaskText: string;
  parentTaskId: string;
}

const TimelineSubTaskItemDisplay = ({ subtask }: { subtask: EnrichedSubTask }) => {
  const Icon = subtask.completed ? CheckSquare : (subtask.scheduledStartTime ? Zap : ListChecks);
  const iconColor = subtask.completed ? "text-green-500" : (subtask.scheduledStartTime ? "text-primary" : "text-muted-foreground");

  let scheduleString = "Unscheduled";
  let scheduleTimeDisplay: React.ReactNode = null;

  if (subtask.scheduledStartTime) {
    try {
      console.log("Processing subtask:", subtask.text, "Schedule:", subtask.scheduledStartTime); // للتحقق من البيانات
      const scheduledDate = parseISO(subtask.scheduledStartTime);
      if (isValid(scheduledDate)) {
        scheduleString = `Scheduled: ${format(scheduledDate, "MMM d, h:mm a")}`;
        scheduleTimeDisplay = (
          <>
            {formatTimelineTime(subtask.scheduledStartTime)}
            {getTimelineDayNightIcon(subtask.scheduledStartTime, Sun, Moon)}
          </>
        );
      } else {
        console.warn("Invalid schedule for task:", subtask.text); // للتحقق من الأخطاء
        scheduleString = "Invalid schedule";
      }
    } catch (error) {
      console.error("Error processing schedule for task:", subtask.text, error); // للتحقق من الأخطاء
      scheduleString = "Error in schedule";
    }
  }

  return (
    <div className="py-2 px-3 mb-2 border rounded-md shadow-sm hover:bg-muted/50 transition-colors bg-card">
      <div className="flex justify-between items-center">
        <span className={cn("font-medium text-sm", subtask.completed && "line-through text-muted-foreground")}>
          {subtask.text}
        </span>
        {subtask.completed && subtask.actualEndTime && isValid(parseISO(subtask.actualEndTime)) && (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-800 dark:text-green-200 dark:border-green-600">
            Completed: {formatTimelineTime(subtask.actualEndTime)}
            {getTimelineDayNightIcon(subtask.actualEndTime, Sun, Moon)}
          </Badge>
        )}
        {!subtask.completed && subtask.scheduledStartTime && isValid(parseISO(subtask.scheduledStartTime)) && (
          <Badge variant="outline" className="text-xs">
            {scheduleTimeDisplay}
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
        <div className="flex items-center">
          <Icon className={cn("h-3.5 w-3.5 mr-1.5", iconColor)} />
          <span>{subtask.completed ? `Completed` : (subtask.scheduledStartTime ? scheduleString : `Unscheduled (Part of: "${subtask.parentTaskText}")`)}</span>
        </div>
        {!subtask.scheduledStartTime && <div className="pl-5">Part of: "{subtask.parentTaskText}"</div>}
        {subtask.scheduledStartTime && <div className="pl-5">From task: "{subtask.parentTaskText}"</div>}

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 pl-5">
          {(subtask.durationMinutes || 0) > 0 &&
            <span className="inline-flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {subtask.durationMinutes}m work</span>}
          {(subtask.breakMinutes || 0) > 0 &&
            <span className="inline-flex items-center"><CoffeeIcon className="h-3 w-3 mr-1" /> {subtask.breakMinutes}m break</span>}
        </div>
      </div>
    </div>
  );
};

const formatMinutesToHoursAndMinutes = (totalMinutes: number) => {
  if (totalMinutes < 0) totalMinutes = 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;
  return result.trim() || "0m";
};

const TIMELINE_START_HOUR = 6; // 6 AM
const TIMELINE_END_HOUR = 23; // 11 PM (displays up to 11:59 PM segment)
const GRANULARITY_MINUTES = 30;
const SEGMENT_HEIGHT_PX = 40; 
const PIXELS_PER_MINUTE = SEGMENT_HEIGHT_PX / GRANULARITY_MINUTES;
const HOUR_LABEL_WIDTH_PX = 70; 
const SHOW_TEXT_MIN_BLOCK_HEIGHT_PX = 18;


const VisualDayTimeline = ({
  subtasks,
  currentDateForView,
  onSubTaskDrop
}: {
  subtasks: EnrichedSubTask[],
  currentDateForView: Date,
  onSubTaskDrop: (subtaskId: string, parentTaskId: string, newStartTime: Date) => void
}) => {
  const [nowLineTop, setNowLineTop] = useState(0);
  const [actualCurrentTime, setActualCurrentTime] = useState<Date | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);


  useEffect(() => {
    const updateLine = () => {
      const now = new Date();
      setActualCurrentTime(now);
      if (!isSameDay(now, currentDateForView)) {
        setNowLineTop(-1); 
        return;
      }
      const currentHour = getHours(now);
      const currentMinute = getMinutes(now);

      if (currentHour < TIMELINE_START_HOUR || currentHour >= TIMELINE_END_HOUR + 1) {
         setNowLineTop(-1); 
      } else {
        const minutesFromTimelineStart = (currentHour - TIMELINE_START_HOUR) * 60 + currentMinute;
        const newTop = minutesFromTimelineStart * PIXELS_PER_MINUTE;
        setNowLineTop(newTop);
      }
    };

    updateLine(); 
    const intervalId = setInterval(updateLine, 60000); 
    return () => clearInterval(intervalId);
  }, [currentDateForView]); 

  const timeSlots = useMemo(() => {
    const slots = [];
    const dayToDisplay = startOfDay(currentDateForView);
    for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
      for (let minuteOffset = 0; minuteOffset < 60; minuteOffset += GRANULARITY_MINUTES) {
        const slotDate = dateFnsSetHours(new Date(dayToDisplay), hour);
        slotDate.setMinutes(minuteOffset);
        slots.push({
          date: slotDate,
          label: format(slotDate, 'h:mm a'),
          isFullHour: minuteOffset === 0,
        });
      }
    }
    return slots;
  }, [currentDateForView]);

  const getSubtaskStyle = (subtask: EnrichedSubTask): React.CSSProperties => {
    if (!subtask.scheduledStartTime || !subtask.durationMinutes || subtask.durationMinutes <= 0) return { display: 'none' };

    let scheduledDate;
    try {
      scheduledDate = parseISO(subtask.scheduledStartTime);
    } catch (e) {
      return { display: 'none' };
    }

    if (!isValid(scheduledDate) || !isSameDay(scheduledDate, currentDateForView)) return { display: 'none' };

    const startHour = getHours(scheduledDate);
    const startMinute = getMinutes(scheduledDate);

    const subtaskStartTotalMinutes = startHour * 60 + startMinute;
    const timelineViewEndTotalMinutes = (TIMELINE_END_HOUR + 1) * 60 -1 ; 

    if (subtaskStartTotalMinutes < TIMELINE_START_HOUR * 60 || subtaskStartTotalMinutes > timelineViewEndTotalMinutes) {
      return { display: 'none' };
    }

    const minutesFromTimelineStart = Math.max(0, subtaskStartTotalMinutes - (TIMELINE_START_HOUR * 60));
    const top = minutesFromTimelineStart * PIXELS_PER_MINUTE;

    let effectiveDurationMinutes = subtask.durationMinutes;
    const subtaskEndTime = addMinutes(scheduledDate, subtask.durationMinutes);
    
    const timelineViewEndDateObj = dateFnsSetHours(startOfDay(currentDateForView), TIMELINE_END_HOUR + 1); 
    const timelineViewEndDate = setMilliseconds(setSeconds(setMinutes(timelineViewEndDateObj, 0),0),0);


    if (isAfter(subtaskEndTime, timelineViewEndDate)) {
      effectiveDurationMinutes = Math.max(0, differenceInMinutes(timelineViewEndDate, scheduledDate));
    }
    
    if (effectiveDurationMinutes <=0) return { display: 'none' };

    const height = effectiveDurationMinutes * PIXELS_PER_MINUTE;

    return {
      top: `${top}px`,
      height: `${Math.max(1, height)}px`, 
      position: 'absolute',
      left: `${HOUR_LABEL_WIDTH_PX}px`,
      right: '15px', 
      zIndex: 10,
      minHeight: '1px', 
    };
  };

  const totalTimelineHeight = ((TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * (60 / GRANULARITY_MINUTES)) * SEGMENT_HEIGHT_PX + 20;

  const getTimePeriodClass = (hour: number): string => {
    if (hour >= TIMELINE_START_HOUR && hour < 12) { 
      return "bg-sky-50 dark:bg-sky-900/30";
    } else if (hour >= 12 && hour < 18) { 
      return "bg-amber-50 dark:bg-amber-800/30";
    } else if (hour >= 18 && hour <= TIMELINE_END_HOUR) { 
      return "bg-indigo-50 dark:bg-indigo-900/30";
    }
    return "bg-card"; 
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, subtask: EnrichedSubTask) => {
    event.dataTransfer.setData("subtaskId", subtask.id);
    event.dataTransfer.setData("parentTaskId", subtask.parentTaskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!timelineRef.current) return;

    const subtaskId = event.dataTransfer.getData("subtaskId");
    const parentTaskId = event.dataTransfer.getData("parentTaskId");
    if (!subtaskId || !parentTaskId) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dropY = event.clientY - timelineRect.top;

    let minutesFromTimelineStart = dropY / PIXELS_PER_MINUTE;
    minutesFromTimelineStart = Math.max(0, minutesFromTimelineStart); 

    const snappedMinutes = Math.round(minutesFromTimelineStart / GRANULARITY_MINUTES) * GRANULARITY_MINUTES;

    let newStartTime = startOfDay(currentDateForView);
    newStartTime = dateFnsSetHours(newStartTime, TIMELINE_START_HOUR);
    newStartTime = addMinutes(newStartTime, snappedMinutes);

    const timelineStartDateTime = dateFnsSetHours(startOfDay(currentDateForView), TIMELINE_START_HOUR);
    const timelineEndDateTimeBoundary = dateFnsSetHours(startOfDay(currentDateForView), TIMELINE_END_HOUR +1 ); 

    if (newStartTime < timelineStartDateTime) newStartTime = timelineStartDateTime;
    if (newStartTime >= timelineEndDateTimeBoundary) {
        const maxMinutes = ((TIMELINE_END_HOUR +1) - TIMELINE_START_HOUR) * 60 - GRANULARITY_MINUTES;
        newStartTime = addMinutes(timelineStartDateTime, maxMinutes);
    }
    
    onSubTaskDrop(subtaskId, parentTaskId, newStartTime);
  };

  return (
    <div
      ref={timelineRef}
      className="my-3 border rounded-md p-2 shadow-sm bg-card relative"
      style={{ height: `${totalTimelineHeight}px` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {timeSlots.map((slot, index) => {
        const slotHour = getHours(slot.date);
        const periodClass = getTimePeriodClass(slotHour);
        return (
          <div
            key={index}
            style={{ height: `${SEGMENT_HEIGHT_PX}px`, position: 'relative' }}
            className={cn("border-b border-dashed border-muted-foreground/30", periodClass)}
          >
            <span
              className="absolute -top-2.5 text-xs text-muted-foreground font-medium"
              style={{ left: `2px`}}
            >
              {slot.label}
            </span>
          </div>
        );
      })}

      {nowLineTop >=0 && nowLineTop <= totalTimelineHeight -20 && actualCurrentTime && ( 
         <div
          className="absolute w-full z-20 pointer-events-none"
          style={{ top: `${nowLineTop}px`, height: '2px', left: `${HOUR_LABEL_WIDTH_PX}px`, width: `calc(100% - ${HOUR_LABEL_WIDTH_PX}px - 15px)`, backgroundColor: 'hsl(var(--destructive))' }}
        >
          <span className="absolute -left-[85px] -top-2.5 text-xs font-semibold bg-background/80 px-1 rounded whitespace-nowrap" style={{color: 'hsl(var(--destructive))'}}>
            Now {format(actualCurrentTime, 'h:mm a')}
          </span>
        </div>
      )}

      {subtasks.map(subtask => {
        const style = getSubtaskStyle(subtask);
        if (style.display === 'none' || !style.height || parseFloat(String(style.height).replace('px','')) < 1 ) return null;

        const blockHeight = parseFloat(String(style.height).replace('px',''));
        const showText = blockHeight >= SHOW_TEXT_MIN_BLOCK_HEIGHT_PX;

        return (
          <div
            key={subtask.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, subtask)}
            style={style}
            className={cn(
              "rounded shadow-sm flex items-center justify-center cursor-grab overflow-hidden", 
              subtask.completed
                ? "bg-green-400/50 dark:bg-green-800/50 border-green-600/70 dark:border-green-700/70 text-green-900 dark:text-green-100"
                : "bg-primary/40 dark:bg-primary/50 border-primary/60 dark:border-primary/70 text-primary-foreground dark:text-white",
              "border px-0.5" 
            )}
            title={`${subtask.text} (${subtask.parentTaskText}) - ${formatTimelineTime(subtask.scheduledStartTime)} for ${subtask.durationMinutes}m`}
          >
            {showText && (
              <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap px-1 py-0.5">
                {subtask.text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};


export function TimelineClock({ tasks }: { tasks: Task[] }) {
  const [extCurrentTime, setExtCurrentTime] = useState<Date | null>(null);
  const [allEnrichedSubTasks, setAllEnrichedSubTasks] = useState<EnrichedSubTask[]>([]);
  const [upcomingForDisplay, setUpcomingForDisplay] = useState<EnrichedSubTask[]>([]);
  const [completedForDisplay, setCompletedForDisplay] = useState<EnrichedSubTask[]>([]);
  const [unscheduledActiveForDisplay, setUnscheduledActiveForDisplay] = useState<EnrichedSubTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dailySummary, setDailySummary] = useState<{
    date: string;
    totalSubTasksToday: number;
    scheduledWorkMinutes: number;
    scheduledBreakMinutes: number;
    completedWorkMinutesToday: number;
    estimatedUnallocatedMinutes: number;
  } | null>(null);
  const [currentDateForView, setCurrentDateForView] = useState<Date>(startOfDay(new Date()));
  const { toast } = useToast();

  const refreshTimelineData = useCallback(() => {
    if (!extCurrentTime) {
      setDailySummary(null);
      return;
    }

    let rawTasks: Task[] = tasks || [];
    console.log("Refreshing timeline with tasks:", rawTasks);
    
    const enrichedSubTasksTemp: EnrichedSubTask[] = [];
    rawTasks.forEach(task => {
      (task.subtasks || []).forEach(st => {
        try {
          let scheduledStartTime: string | undefined;
          
          // تحويل التاريخ والوقت المجدولين إلى تاريخ كامل
          if (st.deadline && st.scheduledTime) {
            try {
              // التحقق من تنسيق التاريخ وتحويله إذا لزم الأمر
              let dateStr = st.deadline;
              if (st.deadline.includes('-')) {
                // إذا كان التاريخ بتنسيق DD-MMM-YYYY
                const [day, month, year] = st.deadline.split('-');
                dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
              }

              console.log(`[TimelineClock] Processing date:`, {
                originalDate: st.deadline,
                formattedDate: dateStr,
                scheduledTime: st.scheduledTime
              });

              // محاولة تحليل التاريخ والوقت
              const dateTime = parse(
                `${dateStr} ${st.scheduledTime}`,
                'yyyy-MMM-dd HH:mm',
                new Date()
              );

              if (isValid(dateTime)) {
                scheduledStartTime = dateTime.toISOString();
                console.log(`[TimelineClock] Successfully processed subtask schedule: ${st.text}`, {
                  parsedDateTime: dateTime,
                  isoString: scheduledStartTime
                });
              } else {
                console.warn(`[TimelineClock] Invalid date/time for subtask: ${st.text}`, {
                  dateStr,
                  scheduledTime: st.scheduledTime
                });
              }
            } catch (error) {
              console.error(`[TimelineClock] Error processing date/time for subtask: ${st.text}`, error);
            }
          }

          const actualEndTimeValid = typeof st.actualEndTime === 'string' && 
            st.actualEndTime.trim() !== '' && 
            isValid(parseISO(st.actualEndTime));

          enrichedSubTasksTemp.push({
            ...st,
            id: st.id || crypto.randomUUID(),
            scheduledStartTime,
            actualEndTime: actualEndTimeValid ? parseISO(st.actualEndTime).toISOString() : undefined,
            parentTaskText: task.text,
            parentTaskId: task.id || '',
          });
        } catch (parseError) {
          console.error("Error processing subtask for timeline:", {
            subtask: st,
            error: parseError
          });
        }
      });
    });

    setAllEnrichedSubTasks(enrichedSubTasksTemp);
    
    const displayDate = startOfDay(currentDateForView);
    const displayDateEnd = endOfDay(currentDateForView);

    // تصنيف المهام حسب حالتها
    const upcoming = enrichedSubTasksTemp.filter(st => 
      !st.completed && 
      st.scheduledStartTime && 
      isSameDay(parseISO(st.scheduledStartTime), displayDate)
    );

    const completed = enrichedSubTasksTemp.filter(st => 
      st.completed && 
      ((st.actualEndTime && isSameDay(parseISO(st.actualEndTime), displayDate)) ||
       (st.scheduledStartTime && isSameDay(parseISO(st.scheduledStartTime), displayDate)))
    );

    const unscheduledActive = enrichedSubTasksTemp.filter(st => 
      !st.completed && !st.scheduledStartTime
    );

    console.log("Timeline data processed:", {
      totalTasks: enrichedSubTasksTemp.length,
      upcoming: upcoming.length,
      completed: completed.length,
      unscheduled: unscheduledActive.length
    });

    setUpcomingForDisplay(upcoming);
    setCompletedForDisplay(completed);
    setUnscheduledActiveForDisplay(unscheduledActive);

    // حساب ملخص اليوم
    const totalSubTasks = upcoming.length + completed.length;
    const scheduledWork = upcoming.reduce((acc, st) => acc + (st.durationMinutes || 0), 0);
    const scheduledBreaks = upcoming.reduce((acc, st) => acc + (st.breakMinutes || 0), 0);
    const completedWork = completed.reduce((acc, st) => {
      if (st.actualEndTime) {
        const actualDuration = differenceInMinutes(
          parseISO(st.actualEndTime),
          parseISO(st.scheduledStartTime || st.actualEndTime)
        );
        return acc + Math.max(0, actualDuration);
      }
      return acc + (st.durationMinutes || 0);
    }, 0);

    setDailySummary({
      date: format(displayDate, 'yyyy-MM-dd'),
      totalSubTasksToday: totalSubTasks,
      scheduledWorkMinutes: scheduledWork,
      scheduledBreakMinutes: scheduledBreaks,
      completedWorkMinutesToday: completedWork,
      estimatedUnallocatedMinutes: 0 // يمكن حسابها لاحقاً إذا لزم الأمر
    });
  }, [tasks, extCurrentTime, currentDateForView]);


  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setExtCurrentTime(now);
    }, 60000); // تحديث كل دقيقة

    setExtCurrentTime(new Date());
    return () => clearInterval(interval);
  }, []);

  // تحديث البيانات عند تغيير المهام أو التاريخ
  useEffect(() => {
    console.log("[TimelineClock] Tasks updated, refreshing display", {
      tasksCount: tasks?.length || 0,
      taskIds: tasks?.map(t => t.id)
    });
    refreshTimelineData();
  }, [tasks, refreshTimelineData]);

  // تحديث المهام الفرعية عند تغيير المهام الرئيسية
  const updateSubTasksOnTaskChange = useCallback(() => {
    if (!tasks) return;
    
    // إنشاء قائمة بالمهام الفرعية المحدثة
    const newEnrichedSubTasks: EnrichedSubTask[] = [];
    tasks.forEach(task => {
      task.subtasks.forEach(subtask => {
        try {
          let scheduledStartTime: string | undefined;
          
          if (subtask.deadline && subtask.scheduledTime) {
            let dateStr = subtask.deadline;
            if (subtask.deadline.includes('-')) {
              const [day, month, year] = subtask.deadline.split('-');
              dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
            }

            const dateTime = parse(
              `${dateStr} ${subtask.scheduledTime}`,
              'yyyy-MMM-dd HH:mm',
              new Date()
            );

            if (isValid(dateTime)) {
              scheduledStartTime = dateTime.toISOString();
            }
          }

          newEnrichedSubTasks.push({
            ...subtask,
            id: subtask.id || crypto.randomUUID(),
            scheduledStartTime,
            parentTaskId: task.id || '',
            parentTaskText: task.text
          });
        } catch (error) {
          console.error("[TimelineClock] Error processing subtask:", error);
        }
      });
    });

    setAllEnrichedSubTasks(newEnrichedSubTasks);
    console.log("[TimelineClock] Updated enriched subtasks:", newEnrichedSubTasks.length);
  }, [tasks]);  // تحديث البيانات عند تغيير المهام
  useEffect(() => {
    if (tasks) {
      updateSubTasksOnTaskChange();
      refreshTimelineData();
    }
  }, [tasks]);

  // تحديث الوقت فقط
  useEffect(() => {
    const now = new Date();
    setExtCurrentTime(now);
  }, []);

  // وظيفة لتحديث البيانات يدوياً
  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      updateSubTasksOnTaskChange();
      refreshTimelineData();
      toast({
        title: "تم التحديث",
        description: "تم تحديث الجدول الزمني بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الجدول الزمني",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateSubTasksOnTaskChange, refreshTimelineData, toast]);


  // إضافة useEffect جديد للتحقق من المهام وطباعة معلومات التشخيص
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      console.log("[TimelineClock] Diagnostic - Tasks received:", tasks);
      tasks.forEach((task, index) => {
        console.log(`[TimelineClock] Task ${index + 1}: ${task.text}`);
        task.subtasks.forEach((subtask, subIndex) => {
          console.log(`[TimelineClock] - Subtask ${subIndex + 1}:`, {
            text: subtask.text,
            deadline: subtask.deadline,
            scheduledTime: subtask.scheduledTime,
          });
        });
      });
    }
  }, [tasks]);


  useEffect(() => {
    if (isModalOpen) {
      refreshTimelineData();
    }
    // إضافة تحديث تلقائي عند تغير المهام
    // إذا لم يكن المودال مفتوحاً، حدث البيانات في الخلفية عند تغير المهام
    if (!isModalOpen) {
      refreshTimelineData();
    }
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === "taskzenith-tasks" && isModalOpen) {
            refreshTimelineData();
        }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isModalOpen) {
        refreshTimelineData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleTasksUpdatedByTimeline = () => {
      if (isModalOpen) refreshTimelineData();
    };
    window.addEventListener('tasksUpdatedByTimeline', handleTasksUpdatedByTimeline);


    return () => {
        window.removeEventListener('storage', handleStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('tasksUpdatedByTimeline', handleTasksUpdatedByTimeline);
    };
  }, [isModalOpen, refreshTimelineData, tasks]);


  const handlePreviousDay = () => {
    setCurrentDateForView(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDateForView(prevDate => addDays(prevDate, 1));
  };

  const handleGoToToday = () => {
    setCurrentDateForView(startOfDay(new Date()));
  };

  const handleScheduleForDate = () => {
    try {
      localStorage.setItem('taskzenith-schedule-for-date', currentDateForView.toISOString());
      toast({
        title: `Planning for ${format(currentDateForView, "MMM d")}`,
        description: "Use the 'Add New Task' button on the main page to add tasks for this date.",
      });
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to set schedule-for-date in localStorage", e);
      toast({
        title: "Error",
        description: "Could not set scheduling date. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubTaskDropOnTimeline = (subtaskId: string, parentTaskId: string, newStartTime: Date) => {
    toast({
      title: "Drag & drop not supported in timeline for cloud tasks.",
      description: "يرجى تعديل توقيت المهمة من صفحة المهام الرئيسية.",
      variant: "destructive",
    });
  };


  if (!extCurrentTime) return null; 

  const timeStringForDialog = formatTimelineTime(extCurrentTime.toISOString() as string);
  const dayNightIconForDialog = getTimelineDayNightIcon(extCurrentTime.toISOString() as string, Sun, Moon);

  const subtasksForVisualTimeline = allEnrichedSubTasks.filter(st =>
    st.scheduledStartTime &&
    isValid(parseISO(st.scheduledStartTime)) &&
    isSameDay(parseISO(st.scheduledStartTime), startOfDay(currentDateForView))
  );

  const noTasksForDisplayDate = upcomingForDisplay.length === 0 && completedForDisplay.length === 0 && subtasksForVisualTimeline.length === 0 && unscheduledActiveForDisplay.length === 0;

  return (
    <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (isOpen) refreshTimelineData(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-0" aria-label="Open Daily Timeline">
          <CalendarClock size={28} />
          <span className="sr-only">Open Daily Timeline</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="pb-2 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center text-xl">
              <CalendarDays className="mr-2 h-6 w-6 text-primary" /> Daily Timeline
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePreviousDay} aria-label="Previous Day">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleGoToToday} disabled={isSameDay(currentDateForView, startOfDay(new Date()))}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextDay} aria-label="Next Day">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs mt-1">
            {dailySummary ? `Snapshot for ${dailySummary.date}.` : "Loading daily analysis..."}
            Current real time: {timeStringForDialog} {dayNightIconForDialog}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto"> 
          {dailySummary && (
            <Card className="my-3 border-primary shadow-md flex-shrink-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-md">Snapshot for {format(currentDateForView, "MMMM d")}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 px-4 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                  <div><ListChecks className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Total Subtasks Today: <Badge variant="secondary" className="ml-1">{dailySummary.totalSubTasksToday}</Badge></div>
                  <div><Clock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Scheduled Work (Uncompleted): <Badge variant="outline" className="ml-1">{formatMinutesToHoursAndMinutes(dailySummary.scheduledWorkMinutes)}</Badge></div>
                  <div><CoffeeIcon className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Scheduled Breaks (Uncompleted): <Badge variant="outline" className="ml-1">{formatMinutesToHoursAndMinutes(dailySummary.scheduledBreakMinutes)}</Badge></div>
                  <div><CheckSquare className="inline h-3.5 w-3.5 mr-1 text-green-500" />Work Completed: <Badge className="bg-green-100 text-green-700 hover:bg-green-200 ml-1 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700">{formatMinutesToHoursAndMinutes(dailySummary.completedWorkMinutesToday)}</Badge></div>
                </div>
                <div className="flex items-center pt-1"><Zap className="inline h-3.5 w-3.5 mr-1 text-primary" />Est. Unallocated Time: <Badge variant="default" className="ml-1">{formatMinutesToHoursAndMinutes(dailySummary.estimatedUnallocatedMinutes)}</Badge></div>
              </CardContent>
            </Card>
          )}

          {(subtasksForVisualTimeline.length > 0 || isSameDay(currentDateForView, startOfDay(new Date()))) && (
            <VisualDayTimeline
              subtasks={subtasksForVisualTimeline}
              currentDateForView={startOfDay(currentDateForView)} 
              onSubTaskDrop={handleSubTaskDropOnTimeline}
            />
          )}

          <div className="space-y-4 py-2 flex-shrink-0"> 
            {noTasksForDisplayDate ? (
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>No Subtasks for {format(currentDateForView, "MMMM d")}</AlertTitle>
                <AlertDescription>
                  No subtasks scheduled or completed for this day. Plan your day or enjoy the free time!
                   You can <Button variant="link" className="p-0 h-auto" onClick={handleScheduleForDate}>add a new task for {format(currentDateForView, "MMM d")}</Button>.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-md">Upcoming on {format(currentDateForView, "MMM d")}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pt-1 pb-2">
                    {upcomingForDisplay.length > 0 ? (
                      upcomingForDisplay.map(subtask => <TimelineSubTaskItemDisplay key={subtask.id} subtask={subtask} />)
                    ) : (
                      <Alert variant="default" className="mx-2 my-1">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-sm">All Clear!</AlertTitle>
                        <AlertDescription className="text-xs">No more subtasks scheduled for later on {format(currentDateForView, "MMM d")}.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {unscheduledActiveForDisplay.length > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-md">Unscheduled Active Subtasks</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pt-1 pb-2">
                      {unscheduledActiveForDisplay.map(subtask => <TimelineSubTaskItemDisplay key={subtask.id} subtask={subtask} />)}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-md">Completed on {format(currentDateForView, "MMM d")}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pt-1 pb-2">
                    {completedForDisplay.length > 0 ? (
                      completedForDisplay.map(subtask => <TimelineSubTaskItemDisplay key={subtask.id} subtask={subtask} />)
                    ) : (
                      <Alert variant="default" className="mx-2 my-1">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-sm">Nothing Completed Yet</AlertTitle>
                        <AlertDescription className="text-xs">No subtasks have been marked as completed on {format(currentDateForView, "MMM d")}.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
        <DialogFooter className="pt-4 border-t flex-shrink-0">
          <Button onClick={handleScheduleForDate} variant="default" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task for {format(currentDateForView, "MMM d")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
