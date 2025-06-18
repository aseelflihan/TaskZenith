// D:\applications\tasks\TaskZenith\src\components\layout\TimelineClock.tsx
// THE ABSOLUTELY, POSITIVELY FINAL VERSION: Adjusts the DialogContent height
// to prevent clipping on mobile devices, ensuring all UI is visible.

"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Target, BrainCircuit, X, Star, Shield, ArrowDown, Briefcase, Clock, CalendarClock } from 'lucide-react';
import { subDays, addDays, startOfDay, addMinutes, isValid, parseISO, format, isSameDay, getHours, getMinutes, parse, areIntervalsOverlapping, differenceInSeconds } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle as RenamedCardTitle } from "@/components/ui/card";
import { AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Task, SubTask, TaskPriority } from "@/lib/types";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getTasksForUser, updateTaskSchedule, optimizeDaySchedule } from '@/lib/actions';

// --- HELPER COMPONENTS AND FUNCTIONS ---
const formatTimelineTime = (isoString: string | undefined): string => {
    if (!isoString) return "";
    try { const date = parseISO(isoString); return isValid(date) ? format(date, "h:mm a") : ""; } catch { return ""; }
};

interface EnrichedSubTask extends SubTask {
  parentTaskText: string;
  parentTaskId: string;
  priority: TaskPriority;
  hasConflict?: boolean;
}

const getPriorityClass = (priority: TaskPriority, completed: boolean, hasConflict?: boolean): string => {
  if (hasConflict && !completed) return "bg-orange-200/80 dark:bg-orange-900/70 border-orange-500 dark:border-orange-600 text-orange-800 dark:text-orange-200 ring-2 ring-orange-400 z-20";
  if (completed) return "bg-green-200/60 dark:bg-green-900/60 border-green-400/50 dark:border-green-700/50 text-green-800 dark:text-green-200 opacity-80";
  switch (priority) {
    case 'high': return "bg-red-200/70 dark:bg-red-900/70 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200";
    case 'medium': return "bg-yellow-200/70 dark:bg-yellow-900/70 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
    case 'low': return "bg-blue-200/70 dark:bg-blue-900/70 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200";
    default: return "bg-yellow-200/70 dark:bg-yellow-900/70 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
  }
};

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
    switch(priority) {
        case 'high': return <Star className="h-3 w-3 mr-1.5 text-red-500 flex-shrink-0" />;
        case 'medium': return <Shield className="h-3 w-3 mr-1.5 text-yellow-500 flex-shrink-0" />;
        case 'low': return <ArrowDown className="h-3 w-3 mr-1.5 text-blue-500 flex-shrink-0" />;
        default: return <Shield className="h-3 w-3 mr-1.5 text-yellow-500 flex-shrink-0" />;
    }
}

const getTimelineGradientClass = (date: Date): string => {
    if (!isSameDay(date, new Date())) return 'bg-background/50';
    const hour = getHours(new Date());
    if (hour >= 5 && hour < 8) return 'bg-gradient-to-b from-sky-100 to-blue-200 dark:from-sky-900 dark:to-blue-950';
    if (hour >= 8 && hour < 17) return 'bg-background/50';
    if (hour >= 17 && hour < 20) return 'bg-gradient-to-b from-blue-200 to-orange-200 dark:from-indigo-900 dark:to-orange-950';
    return 'bg-gradient-to-b from-slate-800 to-slate-950 dark:from-slate-900 dark:to-slate-950';
};

const DraggableSubTaskItem = ({ subtask }: { subtask: EnrichedSubTask }) => {
    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("subtaskId", subtask.id);
        e.dataTransfer.setData("parentTaskId", subtask.parentTaskId);
        e.dataTransfer.effectAllowed = "move";
    };
    return (
        <div draggable onDragStart={onDragStart} className="py-2 px-3 mb-2 border rounded-md shadow-sm hover:bg-muted/50 transition-colors bg-card cursor-grab active:cursor-grabbing">
            <span className="font-medium text-sm">{subtask.text}</span>
            <div className="text-xs text-muted-foreground mt-1 flex items-center"><PriorityIcon priority={subtask.priority} /><span>From: "{subtask.parentTaskText}"</span></div>
        </div>
    );
};

const StaticSubTaskItem = ({ subtask }: { subtask: EnrichedSubTask }) => (
    <div className="py-2 px-3 mb-2 border rounded-md shadow-sm hover:bg-muted/50 transition-colors bg-card relative">
        {subtask.hasConflict && (
            <TooltipProvider><Tooltip><TooltipTrigger asChild><AlertTriangle className="absolute top-1 right-1 h-4 w-4 text-orange-500" /></TooltipTrigger><TooltipContent><p>This task has a time conflict.</p></TooltipContent></Tooltip></TooltipProvider>
        )}
        <div className="flex justify-between items-start">
            <span className={cn("font-medium text-sm pr-2", subtask.completed && "line-through text-muted-foreground")}>{subtask.text}</span>
            {!subtask.completed && subtask.scheduledStartTime && <Badge variant="outline" className="text-xs flex-shrink-0">{formatTimelineTime(subtask.scheduledStartTime)}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground mt-1"><div className="flex items-center"><PriorityIcon priority={subtask.priority} /><span>From: "{subtask.parentTaskText}"</span></div></div>
    </div>
);

const VisualDayTimeline = ({ subtasks, currentDateForView, onDropTask }: { subtasks: EnrichedSubTask[], currentDateForView: Date, onDropTask: (subtaskId: string, parentTaskId: string, newStartTime: Date) => void }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const timelineEventsContainerRef = useRef<HTMLDivElement>(null);
    const nowLineRef = useRef<HTMLDivElement>(null);
    const zoomLevel = 30;
    const PIXELS_PER_MINUTE = 50 / zoomLevel;

    useEffect(() => {
        if (nowLineRef.current && scrollContainerRef.current && isSameDay(currentDateForView, new Date())) {
            scrollContainerRef.current.scrollTop = nowLineRef.current.offsetTop - (scrollContainerRef.current.clientHeight / 3);
        } else if (scrollContainerRef.current) {
            const eightAmPixels = 8 * 60 * PIXELS_PER_MINUTE;
            scrollContainerRef.current.scrollTop = eightAmPixels;
        }
    }, [subtasks, currentDateForView, PIXELS_PER_MINUTE]); 

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const subtaskId = e.dataTransfer.getData("subtaskId");
        const parentTaskId = e.dataTransfer.getData("parentTaskId");
        if (!subtaskId || !timelineEventsContainerRef.current || !scrollContainerRef.current) return;
        const rect = timelineEventsContainerRef.current.getBoundingClientRect();
        const dropY = e.clientY - rect.top + scrollContainerRef.current.scrollTop;
        const minutesFromStart = dropY / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
        const newStartTime = addMinutes(startOfDay(currentDateForView), snappedMinutes);
        onDropTask(subtaskId, parentTaskId, newStartTime);
    };
    
    const minutesNow = getHours(new Date()) * 60 + getMinutes(new Date());
    const backgroundClass = getTimelineGradientClass(currentDateForView);

    return (
        <TooltipProvider delayDuration={150}>
            <div ref={scrollContainerRef} className={cn("relative h-full w-full overflow-y-auto rounded-lg transition-colors duration-1000 p-2", backgroundClass)}>
                <div className="grid grid-cols-[auto_1fr]" style={{ height: `${24 * (60 / zoomLevel) * 50}px` }}>
                    <div className="relative pr-4 border-r">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={`time-${hour}`} style={{ height: `${60 * PIXELS_PER_MINUTE}px` }} className="flex items-start justify-end pt-0.5">
                                <span className="text-xs text-muted-foreground font-medium -translate-y-1/2">{format(addMinutes(startOfDay(new Date()), hour * 60), "h a")}</span>
                            </div>
                        ))}
                    </div>
                    <div ref={timelineEventsContainerRef} onDragOver={onDragOver} onDrop={onDrop} className="relative">
                        {Array.from({ length: 24 * 2 }).map((_, index) => (
                            <div key={`line-${index}`} style={{ height: `${30 * PIXELS_PER_MINUTE}px` }} className={cn("border-b border-dashed", index % 2 === 1 ? "border-muted-foreground/30" : "border-muted-foreground/10")}></div>
                        ))}
                        {isSameDay(currentDateForView, new Date()) && 
                            <div ref={nowLineRef} className="absolute inset-x-0 z-30" style={{ top: `${minutesNow * PIXELS_PER_MINUTE}px` }}>
                                <div className="h-0.5 bg-destructive rounded-full"></div>
                            </div>
                        }
                        {subtasks.map(subtask => {
                            if (!subtask.scheduledStartTime || !subtask.durationMinutes) return null;
                            const startTime = parseISO(subtask.scheduledStartTime);
                            const minutesFromStart = getHours(startTime) * 60 + getMinutes(startTime);
                            const style: React.CSSProperties = { top: `${minutesFromStart * PIXELS_PER_MINUTE}px`, height: `${Math.max(2, subtask.durationMinutes * PIXELS_PER_MINUTE - 2)}px` };
                            return (
                                <Tooltip key={subtask.id}>
                                    <TooltipTrigger asChild>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={style} className={cn("absolute inset-x-2 rounded-lg shadow-lg flex items-center justify-center overflow-hidden border cursor-pointer", getPriorityClass(subtask.priority, subtask.completed, subtask.hasConflict))}>
                                            {subtask.durationMinutes * PIXELS_PER_MINUTE > 18 && <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap px-1">{subtask.text}</span>}
                                        </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-background border-primary shadow-lg">
                                         <div className="p-2 text-sm"><p className="font-bold text-base mb-2">{subtask.text}</p><div className="space-y-1.5 text-muted-foreground"><div className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /><span>From: <span className="font-semibold text-foreground">{subtask.parentTaskText}</span></span></div><div className="flex items-center"><PriorityIcon priority={subtask.priority} /><span>Priority: <span className="font-semibold text-foreground capitalize">{subtask.priority}</span></span></div><div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span>Time: <span className="font-semibold text-foreground">{formatTimelineTime(subtask.scheduledStartTime)} - {formatTimelineTime(addMinutes(startTime, subtask.durationMinutes).toISOString())}</span></span></div></div></div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

const FocusModeView = ({ task, onExit }: { task: EnrichedSubTask, onExit: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(differenceInSeconds(addMinutes(new Date(), task.durationMinutes || 25), new Date()));
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
            <Button onClick={onExit} variant="ghost" className="absolute top-4 right-4"><X className="h-6 w-6" /> Exit Focus Mode</Button>
            <p className="text-xl text-muted-foreground">Focusing on:</p>
            <h2 className="text-4xl font-bold text-center my-4">{task.text}</h2>
            <div className="text-8xl font-mono font-bold my-8 p-4 border-4 rounded-full" style={{ borderColor: getPriorityClass(task.priority, false).split(' ')[2] }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-lg text-muted-foreground">From task: "{task.parentTaskText}"</p>
        </motion.div>
    );
};

export function TimelineClock({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentDateForView, setCurrentDateForView] = useState<Date>(startOfDay(new Date()));
  const [timelineTasks, setTimelineTasks] = useState<Task[]>(initialTasks);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const fetchAndSetTasks = useCallback(async () => {
      if (!session?.user?.id) return;
      setIsLoading(true);
      try { const userTasks = await getTasksForUser(session.user.id); setTimelineTasks(userTasks); } 
      catch (error) { toast({ title: "Error", description: "Could not sync timeline.", variant: "destructive" }); } 
      finally { setIsLoading(false); }
  }, [session, toast]);

  useEffect(() => { setTimelineTasks(initialTasks); }, [initialTasks]);

  const enrichedSubTasks = useMemo(() => {
    let subtasks: EnrichedSubTask[] = (timelineTasks || []).flatMap(task => task.subtasks.map(st => ({ ...st, id: st.id || crypto.randomUUID(), scheduledStartTime: st.scheduledStartTime || (st.deadline && st.scheduledTime ? parse(`${st.deadline} ${st.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date()).toISOString() : undefined), parentTaskText: task.text, parentTaskId: task.id || '', priority: task.priority ?? 'medium' } as EnrichedSubTask)));
    const scheduled = subtasks.filter(st => st.scheduledStartTime && st.durationMinutes && !st.completed && isValid(parseISO(st.scheduledStartTime)));
    for (let i = 0; i < scheduled.length; i++) {
        for (let j = i + 1; j < scheduled.length; j++) {
            const taskA = scheduled[i]; const taskB = scheduled[j];
            const intervalA = { start: parseISO(taskA.scheduledStartTime!), end: addMinutes(parseISO(taskA.scheduledStartTime!), taskA.durationMinutes!) };
            const intervalB = { start: parseISO(taskB.scheduledStartTime!), end: addMinutes(parseISO(taskB.scheduledStartTime!), taskB.durationMinutes!) };
            if (areIntervalsOverlapping(intervalA, intervalB, { inclusive: true })) { taskA.hasConflict = true; taskB.hasConflict = true; }
        }
    }
    return subtasks;
  }, [timelineTasks]);
  
  const { scheduledForDay, unscheduledActive, completedForDay, conflictsCount } = useMemo(() => {
    const displayDate = startOfDay(currentDateForView);
    const scheduled = enrichedSubTasks.filter(st => !st.completed && st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) && isSameDay(parseISO(st.scheduledStartTime), displayDate));
    return {
      scheduledForDay: scheduled,
      unscheduledActive: enrichedSubTasks.filter(st => !st.completed && (!st.scheduledStartTime || !isValid(parseISO(st.scheduledStartTime!)))),
      completedForDay: enrichedSubTasks.filter(st => st.completed && st.actualEndTime && isValid(parseISO(st.actualEndTime)) && isSameDay(parseISO(st.actualEndTime), displayDate)),
      conflictsCount: scheduled.filter(st => st.hasConflict).length
    };
  }, [enrichedSubTasks, currentDateForView]);

  const dailyProgress = useMemo(() => {
    const totalToday = scheduledForDay.length + completedForDay.length;
    return totalToday > 0 ? (completedForDay.length / totalToday) * 100 : 0;
  }, [scheduledForDay, completedForDay]);

  const handleOpenChange = (isOpen: boolean) => { setIsDialogOpen(isOpen); if (isOpen) { fetchAndSetTasks(); setIsFocusMode(false); } };
  
  const handleDropTask = async (subtaskId: string, parentTaskId: string, newStartTime: Date) => {
    toast({ title: "Scheduling task...", description: `Moving task to ${formatTimelineTime(newStartTime.toISOString())}` });
    await updateTaskSchedule({ subtaskId, parentTaskId, newStartTime: newStartTime.toISOString() });
    await fetchAndSetTasks();
    toast({ title: "Success!", description: "Task has been rescheduled." });
  };

  const handleOptimizeDay = async () => {
    setIsOptimizing(true);
    toast({ title: "AI is thinking...", description: "Optimizing your schedule." });
    await optimizeDaySchedule({ tasks: timelineTasks, date: currentDateForView.toISOString() });
    await fetchAndSetTasks();
    setIsOptimizing(false);
    toast({ title: "Schedule Optimized!", description: "Your free slots have been filled." });
  };

  const taskForFocus = useMemo(() => scheduledForDay.filter(t => !t.completed).sort((a,b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime())[0], [scheduledForDay]);
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-1" aria-label="Open Daily Timeline">
              <CalendarClock size={22} />
          </Button>
      </DialogTrigger>
      {/* FINAL FINAL STYLING: h-auto with max-h-[90vh] for flexible and safe mobile height */}
      <DialogContent className="max-w-7xl w-[95%] h-auto max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Daily Timeline View</DialogTitle>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-20">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
        </DialogClose>

        <AnimatePresence>{isFocusMode && taskForFocus && <FocusModeView task={taskForFocus} onExit={() => setIsFocusMode(false)} />}</AnimatePresence>
        
        <header className="p-4 border-b flex-shrink-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="flex justify-between items-center">
                <h2 className="flex items-center text-xl font-semibold"><CalendarDays className="mr-2 h-6 w-6 text-primary" /> Daily Timeline</h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => subDays(p, 1))}><ChevronLeft className="h-5 w-5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDateForView(startOfDay(new Date()))} disabled={isSameDay(currentDateForView, startOfDay(new Date()))}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => addDays(p, 1))}><ChevronRight className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={fetchAndSetTasks} disabled={isLoading}><RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button>
                </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">Viewing: {format(currentDateForView, "EEEE, MMMM d, yyyy")}</p>
                {conflictsCount > 0 && <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />{conflictsCount} Time Conflicts</Badge>}
            </div>
            <div className="mt-3 space-y-1"><div className="flex justify-between text-xs font-medium text-muted-foreground"><span>Daily Progress</span><span>{Math.round(dailyProgress)}%</span></div><Progress value={dailyProgress} className="h-2" /></div>
        </header>
        
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
            <div className="flex-1 flex flex-col p-2 md:p-4 min-w-0">
                <VisualDayTimeline subtasks={scheduledForDay} currentDateForView={currentDateForView} onDropTask={handleDropTask} />
            </div>
            <aside className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l flex flex-col flex-shrink-0 bg-muted/20">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Task Lists</h3>
                    <p className="text-sm text-muted-foreground">Drag unscheduled tasks to the timeline.</p>
                </div>
                <div className="overflow-y-auto p-4 space-y-4">
                    <Card><CardHeader className="p-2"><RenamedCardTitle className="text-base flex items-center gap-2"><span>Upcoming</span><Badge variant="secondary">{scheduledForDay.length}</Badge></RenamedCardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{scheduledForDay.length > 0 ? scheduledForDay.sort((a,b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime()).map(subtask => <StaticSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">All clear!</AlertDescription>}</CardContent></Card>
                    <Card><CardHeader className="p-2"><RenamedCardTitle className="text-base flex items-center gap-2"><span>Unscheduled</span><Badge variant="outline">{unscheduledActive.length}</Badge></RenamedCardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{unscheduledActive.length > 0 ? unscheduledActive.map(subtask => <DraggableSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">All tasks scheduled!</AlertDescription>}</CardContent></Card>
                    <Card><CardHeader className="p-2"><RenamedCardTitle className="text-base flex items-center gap-2"><span>Completed</span><Badge className="bg-green-100 text-green-800">{completedForDay.length}</Badge></RenamedCardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{completedForDay.length > 0 ? completedForDay.map(subtask => <StaticSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">Nothing completed yet.</AlertDescription>}</CardContent></Card>
                </div>
                <div className="p-4 border-t mt-auto space-y-2 bg-muted/40">
                    <Button onClick={handleOptimizeDay} disabled={isOptimizing || unscheduledActive.length === 0} className="w-full"><BrainCircuit className="mr-2 h-4 w-4"/>{isOptimizing ? 'Optimizing...' : 'Optimize My Day'}</Button>
                    {taskForFocus && <Button onClick={() => setIsFocusMode(true)} variant="secondary" className="w-full"><Target className="mr-2 h-4 w-4"/>Enter Focus Mode</Button>}
                </div>
            </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}