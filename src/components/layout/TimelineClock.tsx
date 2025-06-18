// D:\applications\tasks\TaskZenith\src\components\layout\TimelineClock.tsx
// FINAL & COMPLETE version with layout fix and zoom removal, keeping all features.

"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CalendarDays, CheckCircle, Zap, Clock, Briefcase, Coffee as CoffeeIcon, Info, ListChecks, CheckSquare, ChevronLeft, ChevronRight, PlusCircle, CalendarClock, RefreshCw, Star, Shield, ArrowDown, AlertTriangle, Target, BrainCircuit, X } from 'lucide-react';
import { 
  subDays, addDays, startOfDay, addMinutes, isValid, parseISO, 
  format, isSameDay, getHours, getMinutes, setHours as dateFnsSetHours, 
  parse, areIntervalsOverlapping, differenceInSeconds
} from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Task, SubTask, TaskPriority } from "@/lib/types";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getTasksForUser, updateTaskSchedule, optimizeDaySchedule } from '@/lib/actions';

// --- HELPER COMPONENTS AND FUNCTIONS ---

const formatTimelineTime = (isoString: string | undefined): string => {
    if (!isoString) return "";
    try { const date = parseISO(isoString); return isValid(date) ? format(date, "HH:mm") : ""; } catch { return ""; }
};

const formatMinutesToHoursAndMinutes = (totalMinutes: number) => {
    if (totalMinutes <= 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim();
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
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const nowLineRef = useRef<HTMLDivElement>(null);
    const zoomLevel = 30; // Fixed zoom level

    const SEGMENT_HEIGHT_PX = 50;
    const PIXELS_PER_MINUTE = SEGMENT_HEIGHT_PX / zoomLevel;

    useEffect(() => {
        if (nowLineRef.current && timelineContainerRef.current && isSameDay(currentDateForView, new Date())) {
            timelineContainerRef.current.scrollTop = nowLineRef.current.offsetTop - (timelineContainerRef.current.clientHeight / 3);
        }
    }, [subtasks, currentDateForView]); 

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const subtaskId = e.dataTransfer.getData("subtaskId");
        const parentTaskId = e.dataTransfer.getData("parentTaskId");
        if (!subtaskId || !timelineContainerRef.current) return;
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const dropY = e.clientY - rect.top + timelineContainerRef.current.scrollTop;
        const minutesFromStart = dropY / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
        const newStartTime = addMinutes(startOfDay(currentDateForView), snappedMinutes);
        onDropTask(subtaskId, parentTaskId, newStartTime);
    };
    
    const minutesNow = getHours(new Date()) * 60 + getMinutes(new Date());

    return (
        <TooltipProvider delayDuration={150}>
            <div ref={timelineContainerRef} onDragOver={onDragOver} onDrop={onDrop} className="relative h-full w-full overflow-y-auto border rounded-lg p-2 bg-background">
                <div className="relative" style={{ height: `${24 * (60 / zoomLevel) * SEGMENT_HEIGHT_PX}px` }}>
                    {Array.from({ length: 24 * (60 / zoomLevel) }).map((_, index) => {
                        const date = addMinutes(startOfDay(currentDateForView), index * zoomLevel);
                        const isFullHour = getMinutes(date) === 0;
                        return (<div key={index} style={{ height: `${SEGMENT_HEIGHT_PX}px` }} className={cn("border-b border-dashed", isFullHour ? "border-muted-foreground/30" : "border-muted-foreground/10")}>
                            {isFullHour && <span className="absolute -top-2 text-xs text-muted-foreground font-medium" style={{ left: `2px`, transform: `translateY(${index * SEGMENT_HEIGHT_PX}px)` }}>{format(date, 'HH:00')}</span>}
                        </div>);
                    })}
                    
                    {isSameDay(currentDateForView, new Date()) && <div ref={nowLineRef} className="absolute w-full z-30" style={{ top: `${minutesNow * PIXELS_PER_MINUTE}px`, left: `50px`, right: '10px' }}><div className="h-0.5 bg-destructive rounded-full"></div></div>}

                    {subtasks.map(subtask => {
                        if (!subtask.scheduledStartTime || !subtask.durationMinutes) return null;
                        const startTime = parseISO(subtask.scheduledStartTime);
                        const minutesFromStart = getHours(startTime) * 60 + getMinutes(startTime);
                        const style: React.CSSProperties = { top: `${minutesFromStart * PIXELS_PER_MINUTE}px`, height: `${Math.max(2, subtask.durationMinutes * PIXELS_PER_MINUTE - 2)}px`, position: 'absolute', left: `50px`, right: '10px', zIndex: 10 };
                        return (
                            <Tooltip key={subtask.id}>
                                <TooltipTrigger asChild>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={style} className={cn("rounded-sm shadow-sm flex items-center justify-center overflow-hidden border cursor-pointer", getPriorityClass(subtask.priority, subtask.completed, subtask.hasConflict))}>
                                        {subtask.durationMinutes * PIXELS_PER_MINUTE > 18 && <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap px-1">{subtask.text}</span>}
                                    </motion.div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-background border-primary shadow-lg">
                                     <div className="p-2 text-sm"><p className="font-bold text-base mb-2">{subtask.text}</p><div className="space-y-1.5 text-muted-foreground"><div className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /><span>From: <span className="font-semibold text-foreground">{subtask.parentTaskText}</span></span></div><div className="flex items-center"><PriorityIcon priority={subtask.priority} /><span>Priority: <span className="font-semibold text-foreground capitalize">{subtask.priority}</span></span></div><div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span>Time: <span className="font-semibold text-foreground">{format(startTime, 'HH:mm')} - {format(addMinutes(startTime, subtask.durationMinutes), 'HH:mm')}</span></span></div></div></div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
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


// --- MAIN COMPONENT ---
export function TimelineClock({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      unscheduledActive: enrichedSubTasks.filter(st => !st.completed && !st.scheduledStartTime),
      completedForDay: enrichedSubTasks.filter(st => st.completed && st.actualEndTime && isValid(parseISO(st.actualEndTime)) && isSameDay(parseISO(st.actualEndTime), displayDate)),
      conflictsCount: scheduled.filter(st => st.hasConflict).length
    };
  }, [enrichedSubTasks, currentDateForView]);

  const dailyProgress = useMemo(() => {
    const totalToday = scheduledForDay.length + completedForDay.length;
    return totalToday > 0 ? (completedForDay.length / totalToday) * 100 : 0;
  }, [scheduledForDay, completedForDay]);

  const handleOpenChange = (isOpen: boolean) => { setIsModalOpen(isOpen); if (isOpen) { fetchAndSetTasks(); setIsFocusMode(false); } };
  
  const handleDropTask = async (subtaskId: string, parentTaskId: string, newStartTime: Date) => {
    toast({ title: "Scheduling task...", description: `Moving task to ${format(newStartTime, 'HH:mm')}` });
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
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="relative p-0" aria-label="Open Daily Timeline"><CalendarClock size={28} /></Button></DialogTrigger>
      <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0 gap-0">
        <AnimatePresence>{isFocusMode && taskForFocus && <FocusModeView task={taskForFocus} onExit={() => setIsFocusMode(false)} />}</AnimatePresence>
        <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex justify-between items-center">
                <DialogTitle className="flex items-center text-xl"><CalendarDays className="mr-2 h-6 w-6 text-primary" /> Daily Timeline</DialogTitle>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => subDays(p, 1))}><ChevronLeft className="h-5 w-5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDateForView(startOfDay(new Date()))} disabled={isSameDay(currentDateForView, startOfDay(new Date()))}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => addDays(p, 1))}><ChevronRight className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={fetchAndSetTasks} disabled={isLoading}><RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button>
                </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <DialogDescription className="text-xs">Viewing: {format(currentDateForView, "EEEE, MMMM d, yyyy")}</DialogDescription>
                {conflictsCount > 0 && <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />{conflictsCount} Time Conflicts</Badge>}
            </div>
            <div className="mt-3 space-y-1"><div className="flex justify-between text-xs font-medium text-muted-foreground"><span>Daily Progress</span><span>{Math.round(dailyProgress)}%</span></div><Progress value={dailyProgress} className="h-2" /></div>
        </DialogHeader>
          
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-4 min-w-0">
                <VisualDayTimeline subtasks={scheduledForDay} currentDateForView={currentDateForView} onDropTask={handleDropTask} />
            </div>
            <div className="w-80 md:w-96 border-l flex flex-col flex-shrink-0">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Task Lists</h3>
                    <p className="text-sm text-muted-foreground">Drag unscheduled tasks to the timeline.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Card><CardHeader className="p-2"><CardTitle className="text-base flex items-center gap-2"><span>Upcoming</span><Badge variant="secondary">{scheduledForDay.length}</Badge></CardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{scheduledForDay.length > 0 ? scheduledForDay.sort((a,b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime()).map(subtask => <StaticSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">All clear!</AlertDescription>}</CardContent></Card>
                    <Card><CardHeader className="p-2"><CardTitle className="text-base flex items-center gap-2"><span>Unscheduled</span><Badge variant="outline">{unscheduledActive.length}</Badge></CardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{unscheduledActive.length > 0 ? unscheduledActive.map(subtask => <DraggableSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">All tasks scheduled!</AlertDescription>}</CardContent></Card>
                    <Card><CardHeader className="p-2"><CardTitle className="text-base flex items-center gap-2"><span>Completed</span><Badge className="bg-green-100 text-green-800">{completedForDay.length}</Badge></CardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{completedForDay.length > 0 ? completedForDay.map(subtask => <StaticSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">Nothing completed yet.</AlertDescription>}</CardContent></Card>
                </div>
                <div className="p-4 border-t mt-auto space-y-2">
                    <Button onClick={handleOptimizeDay} disabled={isOptimizing || unscheduledActive.length === 0} className="w-full"><BrainCircuit className="mr-2 h-4 w-4"/>{isOptimizing ? 'Optimizing...' : 'Optimize My Day'}</Button>
                    {taskForFocus && <Button onClick={() => setIsFocusMode(true)} variant="secondary" className="w-full"><Target className="mr-2 h-4 w-4"/>Enter Focus Mode</Button>}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}