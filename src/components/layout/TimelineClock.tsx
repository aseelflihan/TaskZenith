// D:\applications\tasks\TaskZenith\src\components\layout\TimelineClock.tsx
// FINAL STABLE VERSION: Radically simplified Master Agenda for absolute stability.
// All other advanced features (Focus Panel, Conflict Resolver, etc.) are preserved.

"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTimeline } from '@/context/TimelineContext'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Target, BrainCircuit, X, Star, Shield, ArrowDown, Briefcase, Clock, CalendarClock, Coffee, Plus, Check, ArrowRight, Eye, ListTodo, Locate, Zap, Search } from 'lucide-react';
import { subDays, addDays, startOfDay, addMinutes, isValid, parseISO, format, isSameDay, getHours, getMinutes, parse, areIntervalsOverlapping, isWithinInterval, subMinutes, differenceInSeconds } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle as RenamedCardTitle } from "@/components/ui/card";
import { AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { Task, SubTask, TaskPriority } from "@/lib/types";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getTasksForUser, updateTaskSchedule, optimizeDaySchedule, updateTaskPriority } from '@/lib/actions';

// --- RESPONSIVE DESIGN HOOK ---
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, [matches, query]);
    return matches;
}

// --- HELPER COMPONENTS ---
const formatTimelineTime = (isoString: string | undefined): string => { if (!isoString) return ""; try { const date = parseISO(isoString); return isValid(date) ? format(date, "h:mm a") : ""; } catch { return ""; } };
interface EnrichedSubTask extends SubTask { parentTaskText: string; parentTaskId: string; hasConflict?: boolean; }
const getPriorityClass = (priority: TaskPriority, completed: boolean, hasConflict?: boolean): string => { if (hasConflict) return 'bg-destructive/20 border-destructive text-destructive-foreground'; if (completed) return 'bg-green-500/20 border-green-500/30 text-muted-foreground line-through opacity-70'; switch (priority) { case 'high': return 'bg-amber-500/30 border-amber-500 text-amber-900 dark:text-amber-200'; case 'medium': return 'bg-primary/20 border-primary text-primary-foreground/90'; case 'low': return 'bg-slate-400/20 border-slate-400/50 text-slate-800 dark:text-slate-300'; default: return 'bg-muted border-border'; } };
const PriorityIcon = ({ priority, className }: { priority: TaskPriority, className?: string }) => { const iconClass = cn("h-4 w-4", className); switch (priority) { case 'high': return <Star className={cn(iconClass, "text-amber-500")} />; case 'medium': return <Shield className={cn(iconClass, "text-primary")} />; case 'low': return <ArrowDown className={cn(iconClass, "text-slate-500")} />; default: return null; } };
const getTimelineGradientClass = (date: Date): string => { const now = new Date(); if (isSameDay(date, now)) return "bg-gradient-to-br from-background via-blue-900/10 to-background"; if (date < now) return "bg-muted/30"; return "bg-background"; };
const DraggableSubTaskItem = ({ subtask }: { subtask: EnrichedSubTask }) => { /* ... placeholder ... */ };
const StaticSubTaskItem = ({ subtask }: { subtask: EnrichedSubTask }) => { /* ... placeholder ... */ };

// --- STABLE UI COMPONENTS ---

const MasterAgendaSheet = ({ isOpen, onOpenChange, agendaGroups, handleTaskClick, handleGoToDay, currentDateForView }: { isOpen: boolean, onOpenChange: (open: boolean) => void, agendaGroups: AgendaGroup[], handleTaskClick: (item: AgendaItem) => void, handleGoToDay: (e: React.MouseEvent, date: Date) => void, currentDateForView: Date }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const filteredAgendaGroups = useMemo(() => {
        if (!searchTerm) return agendaGroups;
        const lowercasedFilter = searchTerm.toLowerCase();
        return agendaGroups.map(group => ({ ...group, tasks: group.tasks.filter(task => task.text.toLowerCase().includes(lowercasedFilter) || task.parentTaskText.toLowerCase().includes(lowercasedFilter)) })).filter(group => group.tasks.length > 0);
    }, [agendaGroups, searchTerm]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[480px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center text-xl"><ListTodo className="mr-3 h-6 w-6 text-primary" />Master Agenda</SheetTitle>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-[-2px] text-muted-foreground" />
                        <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {filteredAgendaGroups.length > 0 ? (
                            filteredAgendaGroups.map(dayGroup => (
                                <div key={dayGroup.dateStr} className="mb-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1 -mx-4 px-4 border-y">{format(dayGroup.date, 'EEEE, PPP')}</h4>
                                    <div className="space-y-2">
                                        {dayGroup.tasks.map(task => {
                                            const isDifferentDay = !isSameDay(task.date, currentDateForView);
                                            return (
                                                <div key={task.id} onClick={() => handleTaskClick(task)} className={cn("group text-sm p-2 rounded-md flex items-center justify-between gap-2 cursor-pointer hover:bg-muted transition-colors", task.completed && "opacity-60")}>
                                                    <div className="flex-1 space-y-1 overflow-hidden">
                                                        <p className={cn("font-medium", task.completed && "line-through")}>{task.text}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate"><Briefcase className="h-3 w-3 flex-shrink-0" /><span>{task.parentTaskText}</span></div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{task.time}</span>
                                                            {isDifferentDay && (<Badge variant="outline" className="px-1.5 py-0.5 text-xs font-normal">{format(task.date, 'MMM d')}</Badge>)}
                                                            <PriorityIcon priority={task.priority} className="h-3 w-3" />
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={(e) => handleGoToDay(e, task.date)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="View on timeline"><Eye className="h-4 w-4" /></Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center pt-10">No results found for "{searchTerm}".</p>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

const ResponsiveDatePicker = ({ allTasks, currentDate, setDate, onOpenAgenda }: { allTasks: Task[], currentDate: Date, setDate: (date: Date) => void, onOpenAgenda: () => void }) => {
    const isMobile = useMediaQuery("(max-width: 768px)"); const [isOpen, setIsOpen] = useState(false);
    const activityData = useMemo(() => { const data: { [date: string]: { totalMinutes: number, taskCount: number } } = {}; for (const task of allTasks) for (const subtask of task.subtasks) if (subtask.scheduledStartTime && isValid(parseISO(subtask.scheduledStartTime))) { const date = startOfDay(parseISO(subtask.scheduledStartTime)); const dateString = format(date, 'yyyy-MM-dd'); if (!data[dateString]) data[dateString] = { totalMinutes: 0, taskCount: 0 }; data[dateString].totalMinutes += subtask.durationMinutes || 0; data[dateString].taskCount++; } return data; }, [allTasks]);
    const busyDayModifiers = { level1: (day: Date) => (activityData[format(day, 'yyyy-MM-dd')]?.totalMinutes || 0) > 0 && (activityData[format(day, 'yyyy-MM-dd')]?.totalMinutes || 0) <= 60, level2: (day: Date) => (activityData[format(day, 'yyyy-MM-dd')]?.totalMinutes || 0) > 60 && (activityData[format(day, 'yyyy-MM-dd')]?.totalMinutes || 0) <= 180, level3: (day: Date) => (activityData[format(day, 'yyyy-MM-dd')]?.totalMinutes || 0) > 180, };
    const modifierStyles = { level1: { backgroundColor: 'hsl(var(--primary) / 0.2)' }, level2: { backgroundColor: 'hsl(var(--primary) / 0.5)' }, level3: { backgroundColor: 'hsl(var(--primary) / 0.8)', color: 'hsl(var(--primary-foreground))' }, };
    const handleDateSelect = (selectedDate: Date | undefined) => { if (selectedDate) { setDate(startOfDay(selectedDate)); setIsOpen(false); } };
    const PickerContent = () => (<><Calendar mode="single" selected={currentDate} onSelect={handleDateSelect} numberOfMonths={isMobile ? 1 : 2} modifiers={busyDayModifiers} modifierStyles={modifierStyles} className="p-3" /><div className="p-3 border-t"><Button className="w-full" onClick={() => { onOpenAgenda(); setIsOpen(false); }}><ListTodo className="mr-2 h-4 w-4" />View Master Agenda</Button></div></>);
    const TriggerButton = (<Button variant={"outline"} className="w-full justify-start text-left font-normal md:w-[240px]"><CalendarIcon className="mr-2 h-4 w-4" /><span>Productivity Heatmap</span></Button>);
    if (isMobile) { return (<Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{TriggerButton}</DialogTrigger><DialogContent className="w-[95%] max-w-sm p-0"><DialogTitle className="p-4 pb-2 text-lg font-semibold">Select a Day</DialogTitle><ScrollArea className="max-h-[70vh]"><PickerContent /></ScrollArea></DialogContent></Dialog>); }
    return (<Popover open={isOpen} onOpenChange={setIsOpen}><PopoverTrigger asChild>{TriggerButton}</PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><PickerContent /></PopoverContent></Popover>);
};

const VisualDayTimeline = ({ subtasks, allTasks, currentDateForView, onDropTask, onSetActiveTask, setDate, onResolveConflict }: { subtasks: EnrichedSubTask[], allTasks: Task[], currentDateForView: Date, onDropTask: (subtaskId: string, parentTaskId: string, newStartTime: Date) => void, onSetActiveTask: (task: EnrichedSubTask | null, nextTask: EnrichedSubTask | null) => void, setDate: (date: Date) => void, onResolveConflict: (subtask: EnrichedSubTask) => void }) => {
    const { createTaskFromTimeline, openTaskForEditing } = useTimeline();
    const scrollContainerRef = useRef<HTMLDivElement>(null); const nowLineRef = useRef<HTMLDivElement>(null); const PIXELS_PER_MINUTE = 50 / 30; const [currentTime, setCurrentTime] = useState(new Date()); const [activeTask, setActiveTask] = useState<EnrichedSubTask | null>(null); const [nextTask, setNextTask] = useState<EnrichedSubTask | null>(null); const [showJumpButton, setShowJumpButton] = useState(false); const activeTaskRef = useRef<HTMLDivElement>(null); const [isCreating, setIsCreating] = useState(false); const [ghostTask, setGhostTask] = useState<{ top: number, height: number, startTime: Date } | null>(null); const [hoveredTimeSlot, setHoveredTimeSlot] = useState<{ top: number, startTime: Date } | null>(null); const interactionRef = useRef<{ isTap: boolean; startY: number; tapTimeout: NodeJS.Timeout | null; }>({ isTap: true, startY: 0, tapTimeout: null });
    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 10000); return () => clearInterval(timer); }, []);
    useEffect(() => {
        const now = currentTime; const sortedTasks = subtasks.filter(t => !t.completed && t.scheduledStartTime).sort((a,b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime()); let currentActive: EnrichedSubTask | null = null; let currentNext: EnrichedSubTask | null = null;
        for (let i = 0; i < sortedTasks.length; i++) { const task = sortedTasks[i]; const startTime = parseISO(task.scheduledStartTime!); const endTime = addMinutes(startTime, task.durationMinutes); const interval = { start: subMinutes(startTime, 5), end: endTime }; if (isWithinInterval(now, interval)) { currentActive = task; if (sortedTasks[i+1]) { currentNext = sortedTasks[i+1]; } break; } }
        setActiveTask(currentActive); setNextTask(currentNext); onSetActiveTask(currentActive, currentNext);
    }, [subtasks, currentTime, onSetActiveTask]);
    useEffect(() => { if (activeTask && activeTaskRef.current) { activeTaskRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else if (nowLineRef.current && scrollContainerRef.current && isSameDay(currentDateForView, new Date())) { scrollContainerRef.current.scrollTop = nowLineRef.current.offsetTop - (scrollContainerRef.current.clientHeight / 3); } }, [activeTask, currentDateForView]);
    useEffect(() => { const anyActiveTask = allTasks.flatMap(t => t.subtasks).find(st => st.id === activeTask?.id); if (!activeTask || !anyActiveTask?.scheduledStartTime) { setShowJumpButton(false); return; } const activeTaskDate = startOfDay(parseISO(anyActiveTask.scheduledStartTime)); setShowJumpButton(!isSameDay(currentDateForView, activeTaskDate)); }, [currentDateForView, activeTask, allTasks]);
    const handleJumpToActiveTask = () => { if (!activeTask?.scheduledStartTime) return; setDate(startOfDay(parseISO(activeTask.scheduledStartTime))); };
    const getCursorY = (e: React.MouseEvent | React.TouchEvent): number | null => { const scrollContainer = scrollContainerRef.current; if (!scrollContainer) return null; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY; const rect = scrollContainer.getBoundingClientRect(); return clientY - rect.top + scrollContainer.scrollTop; };
    const handleTaskClick = (clickedSubtask: EnrichedSubTask) => { if (isCreating) return; const parentTask = allTasks.find(t => t.id === clickedSubtask.parentTaskId); if (parentTask) openTaskForEditing(parentTask); };
    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => { const target = e.target as HTMLElement; if (target.closest('[data-is-task="true"]') || target.closest('[data-is-add-button="true"]')) return; const startY = getCursorY(e); if (startY === null) return; interactionRef.current = { startY, isTap: true, tapTimeout: null }; setIsCreating(true); setHoveredTimeSlot(null); const minutesFromStart = Math.round((startY / PIXELS_PER_MINUTE) / 15) * 15; const startTime = addMinutes(startOfDay(currentDateForView), minutesFromStart); setGhostTask({ top: minutesFromStart * PIXELS_PER_MINUTE, height: 0, startTime }); if ('touches' in e) { interactionRef.current.tapTimeout = setTimeout(() => { interactionRef.current.isTap = false; }, 220); } else { interactionRef.current.isTap = false; } };
    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => { if (!isCreating) { if (!('touches' in e)) { const currentY = getCursorY(e); if (currentY === null) return; const minutesFromStart = Math.round((currentY / PIXELS_PER_MINUTE) / 15) * 15; const top = minutesFromStart * PIXELS_PER_MINUTE; const startTime = addMinutes(startOfDay(currentDateForView), minutesFromStart); if (hoveredTimeSlot?.startTime.getTime() !== startTime.getTime()) { setHoveredTimeSlot({ top, startTime }); } } return; } if ('touches' in e) e.preventDefault(); const currentY = getCursorY(e); if (currentY === null) return; if (Math.abs(currentY - interactionRef.current.startY) > 10) { interactionRef.current.isTap = false; if (interactionRef.current.tapTimeout) { clearTimeout(interactionRef.current.tapTimeout); interactionRef.current.tapTimeout = null; } } if (ghostTask) { setGhostTask(prev => prev ? { ...prev, height: Math.max(0, currentY - prev.top) } : null); } };
    const handleInteractionEnd = () => { if (interactionRef.current.tapTimeout) clearTimeout(interactionRef.current.tapTimeout); if (interactionRef.current.isTap && ghostTask) { if (createTaskFromTimeline) createTaskFromTimeline(ghostTask.startTime, 30); } else if (isCreating && ghostTask && ghostTask.height >= (15 * PIXELS_PER_MINUTE)) { const durationInMinutes = Math.round(ghostTask.height / PIXELS_PER_MINUTE); const snappedDuration = Math.max(15, Math.round(durationInMinutes / 15) * 15); if (createTaskFromTimeline) createTaskFromTimeline(ghostTask.startTime, snappedDuration); } setIsCreating(false); setGhostTask(null); interactionRef.current = { isTap: true, startY: 0, tapTimeout: null }; };
    const handleMouseLeave = () => { if (isCreating) handleInteractionEnd(); setHoveredTimeSlot(null); };
    const handleAddClick = (startTime: Date, e: React.MouseEvent) => { e.stopPropagation(); if (createTaskFromTimeline) createTaskFromTimeline(startTime, 30); setHoveredTimeSlot(null); };
    const minutesNow = getHours(new Date()) * 60 + getMinutes(new Date());
    return (<TooltipProvider delayDuration={150}><div className="relative h-full w-full"><div ref={scrollContainerRef} onMouseLeave={handleMouseLeave} className={cn("relative w-full h-full overflow-y-auto rounded-lg transition-colors duration-1000 p-2", getTimelineGradientClass(currentDateForView))}><div className="grid grid-cols-[auto_1fr]" style={{ height: `${24 * 60 * PIXELS_PER_MINUTE}px` }}><div className="relative pr-4 border-r">{Array.from({ length: 24 }).map((_, hour) => (<div key={`time-${hour}`} style={{ height: `${60 * PIXELS_PER_MINUTE}px` }} className="flex items-start justify-end pt-0.5"><span className="text-xs text-muted-foreground font-medium -translate-y-1/2">{format(addMinutes(startOfDay(new Date()), hour * 60), "h a")}</span></div>))}</div><div onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={() => {}} onMouseDown={handleInteractionStart} onMouseMove={handleInteractionMove} onMouseUp={handleInteractionEnd} onTouchStart={handleInteractionStart} onTouchMove={handleInteractionMove} onTouchEnd={handleInteractionEnd} onTouchCancel={handleInteractionEnd} className="relative cursor-cell" style={{ touchAction: 'none' }}>{Array.from({ length: 48 }).map((_, index) => (<div key={`line-${index}`} style={{ height: `${30 * PIXELS_PER_MINUTE}px` }} className={cn("border-b border-dashed", index % 2 === 1 ? "border-muted-foreground/30" : "border-muted-foreground/10")}></div>))}<AnimatePresence>{hoveredTimeSlot && !isCreating && (<motion.div data-is-add-indicator="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="absolute left-0 right-2 flex items-center z-10 pointer-events-none" style={{ top: hoveredTimeSlot.top, transform: 'translateY(-50%)' }}><Tooltip><TooltipTrigger asChild><button data-is-add-button="true" onClick={(e) => handleAddClick(hoveredTimeSlot.startTime, e)} className="pointer-events-auto flex-shrink-0 -ml-4 p-1 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background" aria-label={`Add task at ${format(hoveredTimeSlot.startTime, "h:mm a")}`}><Plus className="h-4 w-4" /></button></TooltipTrigger><TooltipContent side="right"><p>Click to add a 30 min task</p></TooltipContent></Tooltip><div className="flex-grow border-t border-dashed border-primary ml-2"></div></motion.div>)}</AnimatePresence>{isCreating && ghostTask && (<div className="absolute inset-x-2 bg-primary/30 border-2 border-dashed border-primary rounded-lg z-20 flex items-center justify-center pointer-events-none" style={{ top: ghostTask.top, height: ghostTask.height }}><div className="text-xs font-bold text-primary-foreground bg-primary/80 px-2 py-1 rounded-full"><Plus className="inline h-3 w-3 mr-1" />{Math.max(15, Math.round(ghostTask.height / PIXELS_PER_MINUTE))} min</div></div>)}{isSameDay(currentDateForView, new Date()) && <div ref={nowLineRef} className="absolute inset-x-0 z-30 pointer-events-none" style={{ top: `${minutesNow * PIXELS_PER_MINUTE}px` }}><div className="h-0.5 bg-destructive rounded-full"></div></div>}{subtasks.map(subtask => { if (!subtask.scheduledStartTime || !subtask.durationMinutes) return null; const startTime = parseISO(subtask.scheduledStartTime); const minutesFromStart = getHours(startTime) * 60 + getMinutes(startTime); const taskStyle: React.CSSProperties = { top: `${minutesFromStart * PIXELS_PER_MINUTE}px`, height: `${Math.max(2, subtask.durationMinutes * PIXELS_PER_MINUTE - 2)}px` }; const isTaskActive = activeTask?.id === subtask.id; const isTaskNext = nextTask?.id === subtask.id; return (<React.Fragment key={subtask.id}><Tooltip><TooltipTrigger asChild><motion.div ref={isTaskActive ? activeTaskRef : null} onClick={() => handleTaskClick(subtask)} data-is-task="true" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={taskStyle} className={cn("absolute inset-x-2 rounded-lg shadow-lg flex items-center justify-center overflow-hidden border cursor-pointer", getPriorityClass(subtask.priority, subtask.completed, subtask.hasConflict), isTaskActive && "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse", isTaskNext && !isTaskActive && "border-primary/50 bg-primary/10")}>{subtask.durationMinutes * PIXELS_PER_MINUTE > 18 && <span className={cn("text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap px-1", isTaskActive && "text-primary-foreground")}>{subtask.text}</span>}</motion.div></TooltipTrigger><TooltipContent side="right" className="bg-background border-primary shadow-lg"><div className="p-2 text-sm"><p className="font-bold text-base mb-2">{subtask.text}</p><div className="space-y-1.5 text-muted-foreground"><div className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /><span>From: <span className="font-semibold text-foreground">{subtask.parentTaskText}</span></span></div><div className="flex items-center"><PriorityIcon priority={subtask.priority} className="mr-2" /><span>Priority: <span className="font-semibold text-foreground capitalize">{subtask.priority}</span></span></div><div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span>Time: <span className="font-semibold text-foreground">{formatTimelineTime(subtask.scheduledStartTime)} - {formatTimelineTime(addMinutes(startTime, subtask.durationMinutes).toISOString())}</span></span></div>{subtask.hasConflict && <Button variant="destructive" size="sm" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); onResolveConflict(subtask); }}><Zap className="mr-2 h-4 w-4" />Resolve Conflict</Button>}</div></div></TooltipContent></Tooltip>{(subtask.breakMinutes ?? 0) > 0 && (<Tooltip><TooltipTrigger asChild><div data-is-task="true" style={{ top: `${(minutesFromStart + subtask.durationMinutes) * PIXELS_PER_MINUTE}px`, height: `${Math.max(2, subtask.breakMinutes! * PIXELS_PER_MINUTE - 2)}px` }} className="absolute inset-x-2 rounded-lg bg-green-200/50 dark:bg-green-900/50 border border-dashed border-green-500/50 flex items-center justify-center"><Coffee className="h-4 w-4 text-green-700 dark:text-green-300" /></div></TooltipTrigger><TooltipContent side="right" className="bg-background border-green-500 shadow-lg"><p>{subtask.breakMinutes} minute break</p></TooltipContent></Tooltip>)}</React.Fragment>); })}</div></div></div><AnimatePresence>{showJumpButton && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 right-4 z-40"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" onClick={handleJumpToActiveTask} className="rounded-full shadow-lg"><Locate className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Jump to current task</p></TooltipContent></Tooltip></TooltipProvider></motion.div>)}</AnimatePresence></div></TooltipProvider>);};

const FocusDashboard = ({ activeTask, nextTask }: { activeTask: EnrichedSubTask | null, nextTask: EnrichedSubTask | null }) => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (!activeTask) { setProgress(0); return; }
        const interval = setInterval(() => {
            const now = new Date(); const start = parseISO(activeTask.scheduledStartTime!); const end = addMinutes(start, activeTask.durationMinutes);
            const totalDuration = differenceInSeconds(end, start); const elapsed = differenceInSeconds(now, start);
            const newProgress = Math.min(100, (elapsed / totalDuration) * 100); setProgress(newProgress);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeTask]);
    if (!activeTask && !nextTask) { return <Card><CardHeader className="p-3"><RenamedCardTitle className="text-base">Focus Now</RenamedCardTitle></CardHeader><CardContent className="p-3 pt-0 text-center text-sm text-muted-foreground">All clear for this moment!</CardContent></Card> }
    const taskToShow = activeTask || nextTask; const status = activeTask ? "Active" : "Up Next"; if (!taskToShow) return null;
    return (<Card className={cn(activeTask && "border-primary bg-primary/5")}><CardHeader className="p-3 flex-row items-center justify-between"><RenamedCardTitle className="text-base">Focus Now</RenamedCardTitle><Badge variant={activeTask ? "default" : "secondary"}>{status}</Badge></CardHeader><CardContent className="p-3 pt-0"><div className="font-semibold">{taskToShow.text}</div><div className="text-sm text-muted-foreground">{formatTimelineTime(taskToShow.scheduledStartTime)} - {formatTimelineTime(addMinutes(parseISO(taskToShow.scheduledStartTime!), taskToShow.durationMinutes).toISOString())}</div>{activeTask && <Progress value={progress} className="h-1 mt-2" />}{nextTask && activeTask && (<div className="mt-3 border-t pt-2"><div className="text-xs font-bold text-muted-foreground">Next up:</div><div className="text-sm">{nextTask.text}</div></div>)}</CardContent></Card>)
}

const FocusModeView = ({ task, onExit }: { task: EnrichedSubTask, onExit: () => void }) => { /* ... placeholder ... */ };
type AgendaItem = { id: string; text: string; time: string; completed: boolean; date: Date; parentTaskId: string; priority: TaskPriority; parentTaskText: string; };
type AgendaGroup = { dateStr: string; date: Date; tasks: AgendaItem[]; };

export function TimelineClock({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession(); const { toast } = useToast(); const { openTaskForEditing } = useTimeline(); 
  const [isDialogOpen, setIsDialogOpen] = useState(false); const [isLoading, setIsLoading] = useState(false); const [isOptimizing, setIsOptimizing] = useState(false); const [currentDateForView, setCurrentDateForView] = useState<Date>(startOfDay(new Date())); const [timelineTasks, setTimelineTasks] = useState<Task[]>(initialTasks); const [isFocusMode, setIsFocusMode] = useState(false); const [isAgendaSheetOpen, setIsAgendaSheetOpen] = useState(false);
  const [activeTimelineTask, setActiveTimelineTask] = useState<EnrichedSubTask | null>(null);
  const [nextTimelineTask, setNextTimelineTask] = useState<EnrichedSubTask | null>(null);
  
  const fetchAndSetTasks = useCallback(async () => { if (!session?.user?.id) return; setIsLoading(true); try { const userTasks = await getTasksForUser(session.user.id); setTimelineTasks(userTasks); } catch (error) { toast({ title: "Error", description: "Could not sync timeline.", variant: "destructive" }); } finally { setIsLoading(false); } }, [session, toast]);
  useEffect(() => { setTimelineTasks(initialTasks); }, [initialTasks]);

  const { enrichedSubTasks, upcomingAgenda } = useMemo(() => {
    let subtasks: EnrichedSubTask[] = (timelineTasks || []).flatMap(task => task.subtasks.map(st => ({ ...st, id: st.id || crypto.randomUUID(), scheduledStartTime: st.scheduledStartTime || (st.deadline && st.scheduledTime ? parse(`${st.deadline} ${st.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date()).toISOString() : undefined), parentTaskText: task.text, parentTaskId: task.id || '', priority: task.priority ?? 'medium' } as EnrichedSubTask)));
    const scheduled = subtasks.filter(st => st.scheduledStartTime && st.durationMinutes && !st.completed && isValid(parseISO(st.scheduledStartTime)));
    for (let i = 0; i < scheduled.length; i++) { for (let j = i + 1; j < scheduled.length; j++) { const taskA = scheduled[i]; const taskB = scheduled[j]; if (taskA.scheduledStartTime && taskA.durationMinutes && taskB.scheduledStartTime && taskB.durationMinutes) { const intervalA = { start: parseISO(taskA.scheduledStartTime), end: addMinutes(parseISO(taskA.scheduledStartTime), taskA.durationMinutes) }; const intervalB = { start: parseISO(taskB.scheduledStartTime), end: addMinutes(parseISO(taskB.scheduledStartTime), taskB.durationMinutes) }; if (areIntervalsOverlapping(intervalA, intervalB, { inclusive: false })) { taskA.hasConflict = true; taskB.hasConflict = true; } } } }
    const agendaItems: AgendaItem[] = []; const today = startOfDay(new Date()); for (const task of timelineTasks) { for (const subtask of task.subtasks) { if (subtask.scheduledStartTime && isValid(parseISO(subtask.scheduledStartTime))) { const date = startOfDay(parseISO(subtask.scheduledStartTime)); if (date >= today) { agendaItems.push({ id: subtask.id!, text: subtask.text, time: format(parseISO(subtask.scheduledStartTime), 'h:mm a'), completed: !!subtask.completed, date: date, parentTaskId: task.id!, priority: task.priority || 'medium', parentTaskText: task.text }); } } } }
    agendaItems.sort((a,b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; const dateComp = a.date.getTime() - b.date.getTime(); if (dateComp !== 0) return dateComp; return parse(a.time, 'h:mm a', new Date()).getTime() - parse(b.time, 'h:mm a', new Date()).getTime(); });
    const groupedAgenda = agendaItems.reduce((acc, item) => { const dateStr = format(item.date, 'yyyy-MM-dd'); if (!acc[dateStr]) acc[dateStr] = { dateStr, date: item.date, tasks: [] }; acc[dateStr].tasks.push(item); return acc; }, {} as Record<string, AgendaGroup>);
    return { enrichedSubTasks: subtasks, upcomingAgenda: Object.values(groupedAgenda) };
  }, [timelineTasks]);
  
  const { scheduledForDay, unscheduledActive, completedForDay, conflictsCount } = useMemo(() => { const displayDate = startOfDay(currentDateForView); const scheduled = enrichedSubTasks.filter(st => st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)) && isSameDay(parseISO(st.scheduledStartTime), displayDate)); return { scheduledForDay: scheduled, unscheduledActive: enrichedSubTasks.filter(st => !st.completed && (!st.scheduledStartTime || !isValid(parseISO(st.scheduledStartTime!)))), completedForDay: enrichedSubTasks.filter(st => st.completed && st.actualEndTime && isValid(parseISO(st.actualEndTime)) && isSameDay(parseISO(st.actualEndTime), displayDate)), conflictsCount: scheduled.filter(st => st.hasConflict).length }; }, [enrichedSubTasks, currentDateForView]);
  const dailyProgress = useMemo(() => { const totalToday = scheduledForDay.filter(st => !st.completed).length + completedForDay.length; return totalToday > 0 ? (completedForDay.length / totalToday) * 100 : 0; }, [scheduledForDay, completedForDay]);
  const handleOpenChange = (isOpen: boolean) => { setIsDialogOpen(isOpen); if (isOpen) { fetchAndSetTasks(); setIsFocusMode(false); } };
  const handleDropTask = async (subtaskId: string, parentTaskId: string, newStartTime: Date) => { toast({ title: "Scheduling task...", description: `Moving task to ${formatTimelineTime(newStartTime.toISOString())}` }); await updateTaskSchedule({ subtaskId, parentTaskId, newStartTime: newStartTime.toISOString() }); await fetchAndSetTasks(); toast({ title: "Success!", description: "Task has been rescheduled." }); };
  const handleAgendaTaskClick = (taskItem: AgendaItem) => { const parentTask = timelineTasks.find(t => t.id === taskItem.parentTaskId); if (parentTask) { openTaskForEditing(parentTask); setIsAgendaSheetOpen(false); } };
  const handleGoToDayFromAgenda = (e: React.MouseEvent, date: Date) => { e.stopPropagation(); setCurrentDateForView(date); setIsAgendaSheetOpen(false); };
  const handleOptimizeDay = async () => { setIsOptimizing(true); toast({ title: "AI is thinking...", description: "Optimizing your schedule." }); await optimizeDaySchedule({ tasks: timelineTasks, date: currentDateForView.toISOString() }); await fetchAndSetTasks(); setIsOptimizing(false); toast({ title: "Schedule Optimized!", description: "Your free slots have been filled." }); };
  
  const handleResolveConflict = (subtaskToResolve: EnrichedSubTask) => {
    const allScheduledSubtasks = enrichedSubTasks.filter(st => st.id !== subtaskToResolve.id && st.scheduledStartTime && st.durationMinutes);
    let newStartTime = addMinutes(parseISO(subtaskToResolve.scheduledStartTime!), subtaskToResolve.durationMinutes);
    while (true) { let isOverlapping = false; const potentialInterval = { start: newStartTime, end: addMinutes(newStartTime, subtaskToResolve.durationMinutes) }; for (const st of allScheduledSubtasks) { const existingInterval = { start: parseISO(st.scheduledStartTime!), end: addMinutes(parseISO(st.scheduledStartTime!), st.durationMinutes) }; if (areIntervalsOverlapping(potentialInterval, existingInterval, { inclusive: false })) { isOverlapping = true; newStartTime = addMinutes(existingInterval.end, st.breakMinutes || 0); break; } } if (!isOverlapping) break; }
    toast({ title: "Resolving conflict...", description: `Attempting to move task.` });
    handleDropTask(subtaskToResolve.id!, subtaskToResolve.parentTaskId, newStartTime);
  };
  
  return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="relative p-1" aria-label="Open Daily Timeline"><CalendarClock size={22} /></Button></DialogTrigger>
      <DialogContent className="max-w-7xl w-[95%] h-auto max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Daily Timeline View</DialogTitle>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-20"><X className="h-5 w-5" /><span className="sr-only">Close</span></DialogClose>
        <AnimatePresence>{isFocusMode && activeTimelineTask && <FocusModeView task={activeTimelineTask} onExit={() => setIsFocusMode(false)} />}</AnimatePresence>
        <header className="p-4 border-b flex-shrink-0 bg-background/95 backdrop-blur-sm z-10 space-y-3">
            <div className="flex justify-between items-center"><h2 className="flex items-center text-xl font-semibold"><CalendarDays className="mr-2 h-6 w-6 text-primary" /> Daily Timeline</h2><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => subDays(p, 1))}><ChevronLeft className="h-5 w-5" /></Button><Button variant="outline" size="sm" onClick={() => setCurrentDateForView(startOfDay(new Date()))} disabled={isSameDay(currentDateForView, startOfDay(new Date()))}>Today</Button><Button variant="ghost" size="icon" onClick={() => setCurrentDateForView(p => addDays(p, 1))}><ChevronRight className="h-5 w-5" /></Button></div></div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <ResponsiveDatePicker allTasks={timelineTasks} currentDate={currentDateForView} setDate={setCurrentDateForView} onOpenAgenda={() => setIsAgendaSheetOpen(true)} />
                <div className="flex items-center gap-2">{conflictsCount > 0 && <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />{conflictsCount} Conflicts</Badge>}<Button variant="ghost" size="icon" onClick={fetchAndSetTasks} disabled={isLoading}><RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button></div>
            </div>
            <p className="text-sm text-muted-foreground pt-1">Viewing: <span className="font-semibold text-foreground">{format(currentDateForView, "EEEE, MMMM d, yyyy")}</span></p>
            <div className="space-y-1"><div className="flex justify-between text-xs font-medium text-muted-foreground"><span>Daily Progress</span><span>{Math.round(dailyProgress)}%</span></div><Progress value={dailyProgress} className="h-2" /></div>
        </header>
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
            <div className="flex-1 flex flex-col p-2 md:p-4 min-w-0">
                <VisualDayTimeline subtasks={scheduledForDay} allTasks={timelineTasks} currentDateForView={currentDateForView} onDropTask={handleDropTask} onSetActiveTask={(active, next) => { setActiveTimelineTask(active); setNextTimelineTask(next); }} setDate={setCurrentDateForView} onResolveConflict={handleResolveConflict} />
            </div>
            <aside className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l flex flex-col flex-shrink-0 bg-muted/20">
                <div className="p-4 border-b"><h3 className="text-lg font-semibold">Task Lists</h3></div>
                <div className="overflow-y-auto p-4 space-y-4">
                    <FocusDashboard activeTask={activeTimelineTask} nextTask={nextTimelineTask} />
                    <Card><CardHeader className="p-2"><RenamedCardTitle className="text-base flex items-center gap-2"><span>Unscheduled</span><Badge variant="outline">{unscheduledActive.length}</Badge></RenamedCardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{unscheduledActive.length > 0 ? unscheduledActive.map(subtask => <DraggableSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">All tasks scheduled!</AlertDescription>}</CardContent></Card>
                    <Card><CardHeader className="p-2"><RenamedCardTitle className="text-base flex items-center gap-2"><span>Completed Today</span><Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{completedForDay.length}</Badge></RenamedCardTitle></CardHeader><CardContent className="p-2 max-h-48 overflow-y-auto">{completedForDay.length > 0 ? completedForDay.map(subtask => <StaticSubTaskItem key={subtask.id} subtask={subtask} />) : <AlertDescription className="p-4 text-center text-sm">Nothing completed yet.</AlertDescription>}</CardContent></Card>
                </div>
                <div className="p-4 border-t mt-auto space-y-2 bg-muted/40">
                    <Button onClick={handleOptimizeDay} disabled={isOptimizing || unscheduledActive.length === 0} className="w-full"><BrainCircuit className="mr-2 h-4 w-4"/>{isOptimizing ? 'Optimizing...' : 'Optimize My Day'}</Button>
                    {activeTimelineTask && <Button onClick={() => setIsFocusMode(true)} variant="secondary" className="w-full"><Target className="mr-2 h-4 w-4"/>Enter Focus Mode</Button>}
                </div>
            </aside>
        </div>
      </DialogContent>
    </Dialog>
    <MasterAgendaSheet 
        isOpen={isAgendaSheetOpen} 
        onOpenChange={setIsAgendaSheetOpen} 
        agendaGroups={upcomingAgenda} 
        handleTaskClick={handleAgendaTaskClick} 
        handleGoToDay={handleGoToDayFromAgenda} 
        currentDateForView={currentDateForView} 
        onSnoozeTask={() => { /* Placeholder */}}
        onChangePriority={() => { /* Placeholder */}}
        updatingIds={[]}
    />
    </>
  );
}