// src/components/tasks/ProductivityBar.tsx
// FINAL RESPONSIVE VERSION: The main container now uses grid on mobile
// and flex on desktop, making it fully responsive.

"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Brain, Play, Sparkles } from 'lucide-react';
import type { SubTask, Task } from '@/lib/types';
import { format as formatTime, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductivityBarProps {
  tasks: Task[];
  onStartNextTask: (subtask: SubTask, parentTask: Task) => void;
}

const StatCard = ({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) => (
  <Card className={cn("bg-card/70 backdrop-blur-sm dashboard-card", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium break-anywhere">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent className="card-content">
      <div className="text-2xl font-bold break-anywhere">
        {children}
      </div>
    </CardContent>
  </Card>
);

export function ProductivityBar({ tasks, onStartNextTask }: ProductivityBarProps) {
  const {
    completedToday,
    totalToday,
    totalFocusMinutes,
    nextTask,
    nextTaskParent,
    timeRemainingString,
    dayProgress
  } = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

    let completedToday = 0;
    let totalFocusMinutes = 0;
    
    const allSubtasks = tasks.flatMap(task => 
      task.subtasks.map(st => ({...st, parentTask: task}))
    );
    
    const allSubtasksToday = allSubtasks.filter(st => 
        st.scheduledStartTime && parseISO(st.scheduledStartTime) >= todayStart
    );

    allSubtasksToday.forEach(st => {
      if (st.completed && st.actualEndTime && parseISO(st.actualEndTime) >= todayStart) {
        completedToday++;
        totalFocusMinutes += st.durationMinutes || 0;
      }
    });
    
    const upcomingTasks = allSubtasksToday
      .filter(st => !st.completed && parseISO(st.scheduledStartTime!) > now)
      .sort((a, b) => parseISO(a.scheduledStartTime!).getTime() - parseISO(b.scheduledStartTime!).getTime());

    const nextTask = upcomingTasks[0];
    const nextTaskParent = nextTask ? nextTask.parentTask : undefined;

    const totalSecondsRemaining = Math.max(0, (endOfDay.getTime() - now.getTime()) / 1000);
    const hours = Math.floor(totalSecondsRemaining / 3600);
    const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
    const timeRemainingString = `${hours}h ${minutes}m`;

    const workdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    const totalDaySeconds = Math.max(1, (endOfDay.getTime() - workdayStart.getTime()) / 1000);
    const dayProgress = Math.max(0, 100 - (totalSecondsRemaining / totalDaySeconds) * 100);

    return {
      completedToday,
      totalToday: allSubtasksToday.length,
      totalFocusMinutes,
      nextTask,
      nextTaskParent,
      timeRemainingString,
      dayProgress
    };
  }, [tasks]);

  return (
    <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center">
            <Sparkles className="h-6 w-6 mr-3 text-primary" />
            Your Daily Dashboard
        </h2>
        {/* RESPONSIVE CONTAINER: Grid layout that adjusts to screen size */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
            <StatCard title="Tasks Completed Today" icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}>
                {completedToday} / {totalToday}
            </StatCard>
            <StatCard title="Total Focus Time" icon={<Brain className="h-4 w-4 text-muted-foreground" />}>
                {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
            </StatCard>
            <StatCard title="Time Left in Workday" icon={<Clock className="h-4 w-4 text-muted-foreground" />}>
                <div className="flex items-center gap-4">
                    <span>{timeRemainingString}</span>
                    <div className="w-16">
                        <Progress value={dayProgress} className="h-2" />
                    </div>
                </div>
            </StatCard>

            {nextTask && nextTaskParent && (
                <Card className="md:col-span-2 xl:col-span-1 bg-primary/10 border-primary dashboard-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Next Up: <span className="font-bold">{formatTime(parseISO(nextTask.scheduledStartTime!), 'h:mm a')}</span></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 card-content">
                        <p className="text-lg font-semibold line-clamp-2" 
                           title={nextTask.text}>
                           {nextTask.text}
                        </p>
                        <Button size="sm" onClick={() => onStartNextTask(nextTask, nextTaskParent)} className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Start
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}