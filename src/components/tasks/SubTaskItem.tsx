
"use client";

import type { SubTask, Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Save, X, PlayCircle, Clock, Coffee, Sun, Moon, CalendarDays, AlertTriangle } from "lucide-react"; 
import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseISO, format, isPast, isValid } from 'date-fns';

interface SubTaskItemProps {
  subtask: SubTask;
  parentTask: Task; 
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  onUpdate: (subtaskId: string, newText: string) => void;
  onStartTimer: (subtaskId: string) => void;
}

const formatScheduledInfo = (subtask: SubTask): React.ReactNode => {
  if (!subtask.scheduledStartTime) return null;
  try {
    const scheduledDate = parseISO(subtask.scheduledStartTime);
    if(!isValid(scheduledDate)) return <span className="text-destructive">Invalid Date</span>;

    const dateString = format(scheduledDate, "MMM d");
    const timeString = format(scheduledDate, "h:mm a");
    const Icon = scheduledDate.getHours() >= 6 && scheduledDate.getHours() < 18 ? Sun : Moon;
    const isOverdue = !subtask.completed && isPast(scheduledDate);

    return (
      <span className={cn("ml-0 sm:ml-2 inline-flex items-center flex-wrap", isOverdue ? "text-destructive" : "text-primary")}>
        {isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
        <CalendarDays className="h-3 w-3 mr-1" /> {dateString}
        <Clock className="h-3 w-3 ml-0 sm:ml-1.5 mr-1 mt-1 sm:mt-0" /> {timeString} <Icon className="inline h-3 w-3 ml-0.5 mt-1 sm:mt-0" />
      </span>
    );
  } catch (e) {
    return <span className="text-destructive">Date Error</span>;
  }
};

const formatActualEndTime = (isoString?: string): React.ReactNode => {
  if (!isoString) return null;
   try {
    const date = parseISO(isoString);
    if(!isValid(date)) return null;
    const timeString = format(date, "h:mm a");
    const Icon = date.getHours() >= 6 && date.getHours() < 18 ? Sun : Moon;
    return (
      <>
        Done: {timeString} <Icon className="inline h-3 w-3 ml-1" />
      </>
    );
  } catch (e) {
    return null;
  }
};


export function SubTaskItem({ subtask, parentTask, onToggle, onDelete, onUpdate, onStartTimer }: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text);

  const handleUpdate = () => {
    if (editText.trim() === "") return;
    if (subtask.id) {
      onUpdate(subtask.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors border-b last:border-b-0">
      <Checkbox
        id={`subtask-${subtask.id}`}
        checked={subtask.completed}
        onCheckedChange={() => subtask.id && onToggle(subtask.id)}
        aria-label={`Mark subtask ${subtask.text} as ${subtask.completed ? 'incomplete' : 'complete'}`}
        className="self-start sm:self-center mt-1 sm:mt-0"
      />
      {isEditing ? (
        <Input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="flex-grow h-8 w-full"
          aria-label="Edit subtask text"
        />
      ) : (
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={cn(
            "flex-grow cursor-pointer text-sm w-full",
            subtask.completed && "line-through text-muted-foreground"
          )}
        >
          {subtask.text}
          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
            {(subtask.durationMinutes !== undefined && subtask.durationMinutes > 0) && (
              <span className="inline-flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {subtask.durationMinutes} min
              </span>
            )}
            {(subtask.breakMinutes !== undefined && subtask.breakMinutes > 0) && (
              <span className="inline-flex items-center">
                <Coffee className="h-3 w-3 mr-1" />
                {subtask.breakMinutes} min break
              </span>
            )}
             {subtask.scheduledStartTime && !subtask.completed && formatScheduledInfo(subtask)}
            {subtask.actualEndTime && subtask.completed && (
              <span className="ml-0 sm:ml-2 text-green-600">{formatActualEndTime(subtask.actualEndTime)}</span>
            )}
          </div>
        </label>
      )}
      <div className="flex flex-wrap gap-1 self-start sm:self-center ml-auto sm:ml-0">
        {isEditing ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleUpdate} aria-label="Save subtask changes">
              <Save className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); setEditText(subtask.text); }} aria-label="Cancel subtask edit">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit subtask text">
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => subtask.id && onStartTimer(subtask.id)}
          aria-label="Start timer for this subtask"
          disabled={subtask.completed || (subtask.durationMinutes !== undefined && subtask.durationMinutes <=0)}
        >
          <PlayCircle className="h-4 w-4 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => subtask.id && onDelete(subtask.id)} aria-label="Delete subtask">
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
}
