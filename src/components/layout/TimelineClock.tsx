// D:\applications\tasks\TaskZenith\src\components\layout\TimelineClock.tsx

"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Sun, Moon, CalendarDays, CheckCircle, Zap, Clock, Briefcase, Coffee as CoffeeIcon, Info, ListChecks, CheckSquare, ChevronLeft, ChevronRight, PlusCircle, CalendarClock, RefreshCw, Star, Shield, ArrowDown } from 'lucide-react';
import { 
  subDays, 
  addDays, 
  startOfDay, 
  endOfDay,
  addMinutes, 
  isValid, 
  parseISO, 
  format, 
  isSameDay, 
  getHours, 
  getMinutes, 
  setHours as dateFnsSetHours,
  parse
} from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task, SubTask, TaskPriority } from "@/lib/types";
import { formatTimelineTime, getTimelineDayNightIcon, cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getTasksForUser } from '@/lib/actions';

interface EnrichedSubTask extends SubTask {
  parentTaskText: string;
  parentTaskId: string;
  priority: TaskPriority;
}

const TimelineSubTaskItemDisplay = ({ subtask }: { subtask: EnrichedSubTask }) => {
  const Icon = subtask.completed ? CheckSquare : (subtask.scheduledStartTime ? Zap : ListChecks);
  const iconColor = subtask.completed ? "text-green-500" : (subtask.scheduledStartTime ? "text-primary" : "text-muted-foreground");
  let scheduleTimeDisplay: React.ReactNode = null;

  if (subtask.scheduledStartTime) {
      try {
          const scheduledDate = parseISO(subtask.scheduledStartTime);
          if (isValid(scheduledDate)) {
              scheduleTimeDisplay = (
                  <>
                      {formatTimelineTime(subtask.scheduledStartTime)}
                      {getTimelineDayNightIcon(subtask.scheduledStartTime, Sun, Moon)}
                  </>
              );
          }
      } catch (error) { /* Silently fail */ }
  }
  return (
    <div className="py-2 px-3 mb-2 border rounded-md shadow-sm hover:bg-muted/50 transition-colors bg-card">
      <div className="flex justify-between items-center">
        <span className={cn("font-medium text-sm", subtask.completed && "line-through text-muted-foreground")}>
          {subtask.text}
        </span>
        {!subtask.completed && scheduleTimeDisplay && (
          <Badge variant="outline" className="text-xs">{scheduleTimeDisplay}</Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
        <div className="flex items-center">
          <Icon className={cn("h-3.5 w-3.5 mr-1.5", iconColor)} />
          <span>From task: "{subtask.parentTaskText}"</span>
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

const getPriorityClass = (priority: TaskPriority, completed: boolean): string => {
  if (completed) {
    return "bg-green-200/60 dark:bg-green-900/60 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200";
  }
  switch (priority) {
    case 'high':
      return "bg-red-200/60 dark:bg-red-900/60 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200";
    case 'medium':
      return "bg-yellow-200/60 dark:bg-yellow-900/60 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
    case 'low':
      return "bg-blue-200/60 dark:bg-blue-900/60 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200";
    default:
      // This will now apply to 'medium' if priority is missing, or any other unexpected value.
      return "bg-yellow-200/60 dark:bg-yellow-900/60 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
  }
};

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
    switch(priority) {
        case 'high': return <Star className="h-3 w-3 mr-1.5 text-red-500" />;
        case 'medium': return <Shield className="h-3 w-3 mr-1.5 text-yellow-500" />;
        case 'low': return <ArrowDown className="h-3 w-3 mr-1.5 text-blue-500" />;
        default: return <Shield className="h-3 w-3 mr-1.5 text-yellow-500" />;
    }
}


const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 23;
const GRANULARITY_MINUTES = 30;
const SEGMENT_HEIGHT_PX = 40; 
const PIXELS_PER_MINUTE = SEGMENT_HEIGHT_PX / GRANULARITY_MINUTES;
const HOUR_LABEL_WIDTH_PX = 70; 
const SHOW_TEXT_MIN_BLOCK_HEIGHT_PX = 18;

const VisualDayTimeline = ({ subtasks, currentDateForView }: { subtasks: EnrichedSubTask[], currentDateForView: Date }) => {
  const [nowLineTop, setNowLineTop] = useState(0);

  useEffect(() => {
    const updateLine = () => {
      const now = new Date();
      if (!isSameDay(now, currentDateForView)) {
        setNowLineTop(-1); 
        return;
      }
      const minutesFromTimelineStart = (getHours(now) - TIMELINE_START_HOUR) * 60 + getMinutes(now);
      setNowLineTop(minutesFromTimelineStart * PIXELS_PER_MINUTE);
    };
    updateLine();
    const intervalId = setInterval(updateLine, 60000); 
    return () => clearInterval(intervalId);
  }, [currentDateForView]); 

  const getSubtaskStyle = (subtask: EnrichedSubTask): React.CSSProperties => {
    if (!subtask.scheduledStartTime || !subtask.durationMinutes || subtask.durationMinutes <= 0) return { display: 'none' };
    let scheduledDate;
    try { scheduledDate = parseISO(subtask.scheduledStartTime); } catch (e) { return { display: 'none' }; }
    if (!isValid(scheduledDate) || !isSameDay(scheduledDate, currentDateForView)) return { display: 'none' };

    const minutesFromTimelineStart = (getHours(scheduledDate) - TIMELINE_START_HOUR) * 60 + getMinutes(scheduledDate);
    return {
      top: `${minutesFromTimelineStart * PIXELS_PER_MINUTE}px`,
      height: `${Math.max(1, subtask.durationMinutes * PIXELS_PER_MINUTE)}px`, 
      position: 'absolute',
      left: `${HOUR_LABEL_WIDTH_PX}px`,
      right: '15px', 
      zIndex: 10,
    };
  };

  return (
    <TooltipProvider delayDuration={200}>
        <div
            className="my-3 border rounded-md p-2 shadow-sm bg-background relative"
            style={{ height: `${((TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * (60 / GRANULARITY_MINUTES)) * SEGMENT_HEIGHT_PX + 20}px` }}
        >
            {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }).map((_, hourIndex) => (
                <div key={hourIndex} className="relative" style={{ height: `${(60 / GRANULARITY_MINUTES) * SEGMENT_HEIGHT_PX}px` }}>
                    <span className="absolute -top-2.5 text-xs text-muted-foreground font-medium" style={{ left: `2px`}}>
                        {format(dateFnsSetHours(new Date(), TIMELINE_START_HOUR + hourIndex), 'h a')}
                    </span>
                    {Array.from({ length: 60 / GRANULARITY_MINUTES }).map((__, segmentIndex) => (
                        <div key={segmentIndex} style={{ height: `${SEGMENT_HEIGHT_PX}px` }} className="border-b border-dashed border-muted-foreground/30"></div>
                    ))}
                </div>
            ))}
            
            {nowLineTop >= 0 && (
                <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${nowLineTop}px`, left: `${HOUR_LABEL_WIDTH_PX}px`, right: '15px' }}>
                    <div className="h-0.5 bg-destructive"></div>
                </div>
            )}

            {subtasks.map(subtask => {
                const style = getSubtaskStyle(subtask);
                if (style.display === 'none') return null;

                const blockHeight = parseFloat(String(style.height).replace('px', ''));
                const showText = blockHeight >= SHOW_TEXT_MIN_BLOCK_HEIGHT_PX;

                const startTime = parseISO(subtask.scheduledStartTime!);
                const endTime = addMinutes(startTime, subtask.durationMinutes || 0);

                return (
                    <Tooltip key={subtask.id}>
                        <TooltipTrigger asChild>
                            <div style={style} className={cn("rounded-sm shadow-sm flex items-center justify-center overflow-hidden border cursor-pointer", getPriorityClass(subtask.priority, subtask.completed))}>
                                {showText && <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap px-1">{subtask.text}</span>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-background border-primary shadow-lg">
                            <div className="p-2 text-sm">
                                <p className="font-bold text-base mb-2">{subtask.text}</p>
                                <div className="space-y-1.5 text-muted-foreground">
                                    <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /><span>From Task: <span className="font-semibold text-foreground">{subtask.parentTaskText}</span></span></div>
                                    <div className="flex items-center"><PriorityIcon priority={subtask.priority} /><span>Priority: <span className="font-semibold text-foreground capitalize">{subtask.priority}</span></span></div>
                                    <div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span>Time: <span className="font-semibold text-foreground">{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span></span></div>
                                    <div className="flex items-center"><Zap className="h-4 w-4 mr-2" /><span>Duration: <span className="font-semibold text-foreground">{subtask.durationMinutes} minutes</span></span></div>
                                    {subtask.breakMinutes && subtask.breakMinutes > 0 && (
                                        <div className="flex items-center"><CoffeeIcon className="h-4 w-4 mr-2" /><span>Break: <span className="font-semibold text-foreground">{subtask.breakMinutes} minutes</span></span></div>
                                    )}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    </TooltipProvider>
  );
};


export function TimelineClock({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDateForView, setCurrentDateForView] = useState<Date>(startOfDay(new Date()));
  const [timelineTasks, setTimelineTasks] = useState<Task[]>(initialTasks);

  const fetchAndSetTasks = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const userTasks = await getTasksForUser(session.user.id);
      setTimelineTasks(userTasks);
    } catch (error) {
      toast({ title: "Error", description: "Could not sync timeline.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    setTimelineTasks(initialTasks);
  }, [initialTasks]);

  const enrichedSubTasks = useMemo(() => {
    return (timelineTasks || []).flatMap(task =>
      (task.subtasks || []).map(st => {
        let scheduledStartTime: string | undefined = undefined;
        if (st.deadline && st.scheduledTime) {
          const parsed = parse(`${st.deadline} ${st.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date());
          if (isValid(parsed)) scheduledStartTime = parsed.toISOString();
        }
        return {
          ...st,
          id: st.id || crypto.randomUUID(),
          scheduledStartTime: st.scheduledStartTime || scheduledStartTime,
          parentTaskText: task.text,
          parentTaskId: task.id || '',
          // *** THE KEY CHANGE IS HERE ***
          // Use task.priority. If it's null or undefined, default to 'medium'.
          priority: task.priority ?? 'medium', 
        };
      })
    );
  }, [timelineTasks]);
  
  const displayedSubTasks = useMemo(() => {
    const displayDate = startOfDay(currentDateForView);
    return enrichedSubTasks.filter(st => 
      st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) && isSameDay(parseISO(st.scheduledStartTime), displayDate)
    );
  }, [enrichedSubTasks, currentDateForView]);

  const dailySummary = useMemo(() => {
    const tasksForDate = displayedSubTasks;
    const completedTasks = tasksForDate.filter(t => t.completed);
    const upcomingTasks = tasksForDate.filter(t => !t.completed);
    return {
      date: format(currentDateForView, 'yyyy-MM-dd'),
      totalSubTasksToday: tasksForDate.length,
      scheduledWorkMinutes: upcomingTasks.reduce((acc, st) => acc + (st.durationMinutes || 0), 0),
      scheduledBreakMinutes: upcomingTasks.reduce((acc, st) => acc + (st.breakMinutes || 0), 0),
      completedWorkMinutesToday: completedTasks.reduce((acc, st) => acc + (st.durationMinutes || 0), 0),
    };
  }, [displayedSubTasks, currentDateForView]);

  const handleOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    if (isOpen) fetchAndSetTasks();
  };

  const handlePreviousDay = () => setCurrentDateForView(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDateForView(prev => addDays(prev, 1));
  const handleGoToToday = () => setCurrentDateForView(startOfDay(new Date()));

  const handleScheduleForDate = () => {
    try {
      localStorage.setItem('taskzenith-schedule-for-date', currentDateForView.toISOString());
      toast({ title: `Planning for ${format(currentDateForView, "MMM d")}`, description: "Use 'Add New Task' on the main page."});
      setIsModalOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Could not set scheduling date.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-0" aria-label="Open Daily Timeline">
          <CalendarClock size={28} />
          <span className="sr-only">Open Daily Timeline</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-2 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                  <DialogTitle className="flex items-center text-xl">
                      <CalendarDays className="mr-2 h-6 w-6 text-primary" /> Daily Timeline
                  </DialogTitle>
                  <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handlePreviousDay} aria-label="Previous Day"><ChevronLeft className="h-5 w-5" /></Button>
                      <Button variant="outline" size="sm" onClick={handleGoToToday} disabled={isSameDay(currentDateForView, startOfDay(new Date()))}>Today</Button>
                      <Button variant="ghost" size="icon" onClick={handleNextDay} aria-label="Next Day"><ChevronRight className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={fetchAndSetTasks} disabled={isLoading} aria-label="Refresh Timeline">
                          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      </Button>
                  </div>
              </div>
              <DialogDescription className="text-xs mt-1">
                  Viewing schedule for: {format(currentDateForView, "EEEE, MMMM d, yyyy")}
              </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto p-1"> 
              <Card className="my-3 border-primary shadow-md flex-shrink-0">
                <CardHeader className="py-3 px-4"><CardTitle className="text-md">Snapshot for {format(currentDateForView, "MMMM d")}</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1.5 px-4 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <div><ListChecks className="inline h-3.5 w-3.5 mr-1"/>Total Subtasks: <Badge variant="secondary">{dailySummary.totalSubTasksToday}</Badge></div>
                        <div><Clock className="inline h-3.5 w-3.5 mr-1"/>Scheduled Work: <Badge variant="outline">{formatMinutesToHoursAndMinutes(dailySummary.scheduledWorkMinutes)}</Badge></div>
                        <div><CoffeeIcon className="inline h-3.5 w-3.5 mr-1"/>Scheduled Breaks: <Badge variant="outline">{formatMinutesToHoursAndMinutes(dailySummary.scheduledBreakMinutes)}</Badge></div>
                        <div><CheckSquare className="inline h-3.5 w-3.5 mr-1 text-green-500"/>Work Completed: <Badge className="bg-green-100 text-green-700">{formatMinutesToHoursAndMinutes(dailySummary.completedWorkMinutesToday)}</Badge></div>
                    </div>
                </CardContent>
              </Card>

              <VisualDayTimeline
                  subtasks={displayedSubTasks}
                  currentDateForView={currentDateForView} 
              />

              {displayedSubTasks.length === 0 && (
                  <Alert variant="default" className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Subtasks for {format(currentDateForView, "MMMM d")}</AlertTitle>
                      <AlertDescription>No subtasks are scheduled for this day.</AlertDescription>
                  </Alert>
              )}
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