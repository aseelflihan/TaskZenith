
"use client";

import type { Task, SubTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Edit2, Trash2, PlayCircle, GripVertical, CalendarDays, Clock, AlertTriangle, Sun, Moon } from "lucide-react";
import { SubTaskItem } from "./SubTaskItem";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, parseISO, format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void; // Toggles main task and all its subtasks
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onStartTimer: (task: Task) => void; // Starts timer for the first available subtask
  onStartSubTaskTimer: (subtask: SubTask, parentTask: Task) => void;
  onUpdateSubTask: (taskId: string, subtaskId: string, newText: string) => void;
  onDeleteSubTask: (taskId: string, subtaskId: string) => void;
  onToggleSubTask: (taskId: string, subtaskId: string) => void; // Toggles individual subtask
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, targetTaskId: string) => void;
}

// Helper remains the same as it's used in SubTaskItem too
const formatTimeWithIcon = (isoString?: string): React.ReactNode => {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    const timeString = format(date, "h:mm a");
    const Icon = date.getHours() >= 6 && date.getHours() < 18 ? Sun : Moon;
    return (
      <>
        {timeString} <Icon className="inline h-3 w-3 ml-1" />
      </>
    );
  } catch (e) {
    return "Invalid Date";
  }
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onStartTimer, // This will find the first subtask to start
  onStartSubTaskTimer, // This is for starting a specific subtask's timer
  onUpdateSubTask,
  onDeleteSubTask,
  onToggleSubTask,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: TaskItemProps) {
  
  const subtaskCompletionPercentage = task.subtasks.length > 0
    ? (task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100
    : task.completed ? 100 : 0; // If no subtasks, main task completion dictates 100 or 0

  const priorityBadgeVariant = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleSubTaskTimerStart = (subtaskId: string) => {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onStartSubTaskTimer(subtask, task);
    }
  };
  
  // Check if any subtask is schedulable (has duration > 0 and not completed)
  const canStartAnySubtask = task.subtasks.some(st => !st.completed && (st.durationMinutes || 0) > 0);

  return (
    <Card 
      className={cn(
        "mb-4 shadow-md hover:shadow-lg transition-shadow duration-200",
        task.completed && "opacity-70 bg-muted/30",
        isDraggable && "cursor-grab"
      )}
      draggable={isDraggable}
      onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragOver={isDraggable && onDragOver ? onDragOver : undefined}
      onDrop={isDraggable && onDrop ? (e) => onDrop(e, task.id) : undefined}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 space-y-0 p-4">
        {isDraggable && (
          <button aria-label="Drag task" className="p-1 focus:outline-none focus:ring-2 focus:ring-ring rounded self-center sm:self-auto">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1 self-start sm:self-center"
          aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <div className="flex-1 grid gap-1 w-full">
          <CardTitle className={cn("text-md sm:text-lg", task.completed && "line-through")}>{task.text}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Created {task.createdAt ? formatDistanceToNowStrict(parseISO(task.createdAt), { addSuffix: true }) : 'N/A'}
          </CardDescription>
           <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            {task.priority && <Badge variant={priorityBadgeVariant(task.priority)}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 self-start sm:self-center ml-auto sm:ml-0">
          <Button variant="ghost" size="icon" onClick={() => onStartTimer(task)} aria-label="Start timer for this task's subtasks" disabled={task.completed || !canStartAnySubtask}>
            <PlayCircle className="h-5 w-5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task">
            <Edit2 className="h-5 w-5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">
            <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </CardHeader>

      {task.subtasks.length > 0 && ( // Only show accordion if there are subtasks
        <CardContent className="p-4 pt-0">
            <Accordion type="single" collapsible className="w-full" defaultValue={task.subtasks.length > 0 ? "subtasks" : undefined}>
              <AccordionItem value="subtasks" className="border-b-0">
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center gap-2 w-full">
                    <span>Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</span>
                    <Progress value={subtaskCompletionPercentage} className="flex-1 h-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-1">
                  {task.subtasks.map(subtask => (
                    <SubTaskItem
                      key={subtask.id}
                      subtask={subtask}
                      parentTask={task} // Pass parentTask for context
                      onToggle={(subtaskId) => onToggleSubTask(task.id, subtaskId)}
                      onDelete={(subtaskId) => onDeleteSubTask(task.id, subtaskId)}
                      onUpdate={(subtaskId, newText) => onUpdateSubTask(task.id, subtaskId, newText)}
                      onStartTimer={handleSubTaskTimerStart} // Starts this specific subtask's timer
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </CardContent>
      )}
    </Card>
  );
}

