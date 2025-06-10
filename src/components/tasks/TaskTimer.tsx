
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Coffee, Sun, Moon, ClockIcon, CheckCircle } from 'lucide-react';
import type { ActiveTimerTarget, TimerSessionType } from '@/lib/types'; // SubTask is now primary
import { format, parseISO } from 'date-fns';

const DEFAULT_SUBTASK_DURATION_MINUTES = 25;

interface TaskTimerProps {
  activeTarget: ActiveTimerTarget | null; // Will always be a subtask
  sessionType: TimerSessionType;
  onTimerComplete: () => void;
  onBreakManuallyEnded: () => void;
}

export function TaskTimer({ activeTarget, sessionType, onTimerComplete, onBreakManuallyEnded }: TaskTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // Initialize to null

  const formatTimeWithIconDisplay = (date: Date | null): string => {
    if (!date) return "";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; 
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    return timeString;
  };
  
  const getTimeIconDisplay = (date: Date | null) => {
    if (!date) return null;
    const hours = date.getHours();
    return hours >= 6 && hours < 18 ? <Sun className="inline h-4 w-4 ml-1" /> : <Moon className="inline h-4 w-4 ml-1" />;
  };


  const initializeTimer = useCallback(() => {
    if (activeTarget && activeTarget.type === 'subtask') { 
      setIsRunning(false); 
      const subtaskData = activeTarget.data;
      let durationMinutes;

      if (sessionType === 'work') {
        durationMinutes = subtaskData.durationMinutes || DEFAULT_SUBTASK_DURATION_MINUTES;
      } else { 
        durationMinutes = subtaskData.breakMinutes || 0;
      }
      const newTotalDuration = durationMinutes * 60;
      setTimeLeft(newTotalDuration);
      setTotalDuration(newTotalDuration);
      
      if (newTotalDuration > 0) {
        setIsRunning(true);
      } else {
        setIsRunning(false); 
      }

    } else {
      setTimeLeft(0);
      setTotalDuration(0);
      setIsRunning(false);
    }
  }, [activeTarget, sessionType]);

  useEffect(() => {
    initializeTimer();
  }, [activeTarget, sessionType, initializeTimer]);

  // Effect for currentTime state and its interval, runs only on client
  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on client mount

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []); // Empty dependency array ensures this runs once on mount (client-side)


  // Effect for the main timer logic (timeLeft, isRunning)
  useEffect(() => {
    if (!isRunning || !activeTarget || timeLeft <= 0) {
      if (isRunning && activeTarget && timeLeft <= 0 && totalDuration > 0) {
        onTimerComplete();
      }
      // Only set isRunning to false if the timer actually reached 0 or was not supposed to run
      if (timeLeft <= 0 || !activeTarget) {
          setIsRunning(false);
      }
      return; // No interval to set up if not running or no time left
    }

    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isRunning, timeLeft, activeTarget, totalDuration, onTimerComplete]);


  const handleStartPause = () => {
    if (!activeTarget) return;

    if (sessionType === 'break' && totalDuration === 0 && !isRunning) {
      onBreakManuallyEnded(); 
      return;
    }
    if (sessionType === 'work' && totalDuration === 0) return;
    
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    if (activeTarget) {
      initializeTimer(); 
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  let projectedEndTime: Date | null = null;
  if (isRunning && totalDuration > 0 && timeLeft > 0 && activeTarget?.data.scheduledStartTime) {
      try {
          projectedEndTime = new Date(Date.now() + timeLeft * 1000);
      } catch {}
  }


  const getStartPauseButtonText = () => {
    if (!isRunning) {
        if (sessionType === 'break' && totalDuration === 0) return 'End Break';
        return 'Start';
    }
    return 'Pause';
  };


  if (!activeTarget) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="mr-2 h-6 w-6 text-muted-foreground" /> Task Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No subtask selected or timer active.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {currentTime ? (
              <>Current time: {formatTimeWithIconDisplay(currentTime)} {getTimeIconDisplay(currentTime)}</>
            ) : (
              "Loading current time..."
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeSubTask = activeTarget.data;

  const getTitle = () => {
    let descriptiveName = activeSubTask.text;
    if (sessionType === 'break') {
      return <span className="flex items-center truncate"><Coffee className="mr-2 h-4 w-4 text-accent flex-shrink-0"/>Break for: {descriptiveName}</span>;
    }
    return <span className="truncate">Subtask: {descriptiveName}</span>;
  };

  const getDescription = () => {
    if (sessionType === 'break') {
      return `Scheduled Break (${activeSubTask.breakMinutes || 0} min).`;
    }
    let workDuration = activeSubTask.durationMinutes || DEFAULT_SUBTASK_DURATION_MINUTES;
    return `Focus Session (${workDuration} min).`;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="truncate text-lg">
          {getTitle()}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Parent Task: {activeTarget.parentTask.text}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {currentTime ? (
            <>Current: {formatTimeWithIconDisplay(currentTime)} {getTimeIconDisplay(currentTime)}</>
          ) : (
            "Current: Loading..."
          )}
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <div className={`text-6xl font-mono font-bold mb-2 ${sessionType === 'break' ? 'text-accent' : 'text-primary'}`}>
          {formatTime(timeLeft)}
        </div>
        <Progress value={progressPercentage} className={`w-full h-3 ${sessionType === 'break' ? '[&>div]:bg-accent' : ''}`} />
        <p className="text-sm text-muted-foreground mt-2">
          {getDescription()}
        </p>
        {projectedEndTime && (
          <p className="text-xs text-muted-foreground mt-1">
            Ends at: {formatTimeWithIconDisplay(projectedEndTime)} {getTimeIconDisplay(projectedEndTime)}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 w-full">
            <Button
                onClick={handleStartPause}
                variant={isRunning ? "outline" : "default"}
                size="lg"
                className="flex-1"
                 disabled={(sessionType === 'work' && totalDuration === 0 && !isRunning)} 
            >
            {isRunning ? <Pause className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
            {getStartPauseButtonText()}
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
            <RotateCcw className="mr-2 h-5 w-5"/> Reset
            </Button>
        </div>
        {sessionType === 'break' && totalDuration > 0 && ( 
            <Button onClick={onBreakManuallyEnded} variant="secondary" size="lg" className="w-full mt-2 sm:mt-0">
                <CheckCircle className="mr-2 h-5 w-5" /> End Break Now
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
