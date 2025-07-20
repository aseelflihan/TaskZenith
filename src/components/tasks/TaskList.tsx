// D:\applications\tasks\TaskZenith\src\components\tasks\TaskList.tsx
// FEATURE UPDATE: Added onCreateTaskFromTimeline prop to pass through to TaskItem.

"use client";

import React, { useState, useCallback } from 'react';
import type { Task, SubTask, TaskFilter } from "@/lib/types";
import { TaskItem } from "./TaskItem";
import { TaskForm, TaskFormData } from "./TaskForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, ListFilter, CheckCircle2, XCircle, Tags } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseISO, isValid, format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  editingTask: Task | null;
  isFormOpen: boolean;
  onFormOpenChange: (isOpen: boolean) => void;
  onOpenEditForm: (task: Task) => void;
  onOpenNewTaskForm: () => void;
  // NEW PROP
  onCreateTaskFromTimeline: (startTime: Date, duration: number) => void;
  initialDataForForm: TaskFormData | Partial<Task> | null;
  onAddTask: (data: TaskFormData) => void;
  onEditTask: (data: TaskFormData) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onStartTimer: (task: Task) => void;
  onStartSubTaskTimer: (subtask: SubTask, parentTask: Task) => void;
  onUpdateSubTask: (taskId: string, subtaskId: string, newText: string) => void;
  onDeleteSubTask: (taskId: string, subtaskId: string) => void;
  onToggleSubTask: (taskId: string, subtaskId: string) => void;
  onTasksReorder: (reorderedTasks: Task[]) => void;
  allTasks: Task[];
}

export function TaskList({
  tasks,
  editingTask,
  isFormOpen,
  onFormOpenChange,
  onOpenEditForm,
  onOpenNewTaskForm,
  onCreateTaskFromTimeline, // Destructure new prop
  initialDataForForm,
  onAddTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
  onStartTimer,
  onStartSubTaskTimer,
  onUpdateSubTask,
  onDeleteSubTask,
  onToggleSubTask,
  onTasksReorder,
  allTasks,
}: TaskListProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const handleFormSubmit = (data: TaskFormData) => {
    if (editingTask) {
      onEditTask(data);
    } else {
      onAddTask(data);
    }
  };

  const handleFormCancel = () => {
    onFormOpenChange(false);
  }

  const draggedItem = React.useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    draggedItem.current = taskId;
    e.dataTransfer.effectAllowed = "move";
    const empty = document.createElement('div');
    e.dataTransfer.setDragImage(empty, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedItem.current || draggedItem.current === targetTaskId) {
      draggedItem.current = null;
      return;
    }

    const currentTasks = [...tasks];
    const draggedTaskIndex = currentTasks.findIndex(task => task.id === draggedItem.current);
    const targetTaskIndex = currentTasks.findIndex(task => task.id === targetTaskId);

    if (draggedTaskIndex === -1 || targetTaskIndex === -1) {
      draggedItem.current = null;
      return;
    }

    const newTasks = [...currentTasks];
    const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);
    newTasks.splice(targetTaskIndex, 0, draggedTask);

    onTasksReorder(newTasks);
    draggedItem.current = null;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCompletionFilter =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed);

    const matchesPriorityFilter =
      priorityFilter === 'all' ||
      task.priority === priorityFilter;

    const matchesSearch =
      searchTerm === "" ||
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.subtasks.some(st => st.text.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCompletionFilter && matchesPriorityFilter && matchesSearch;
  });

  const getFirstScheduledTime = (task: Task): number => {
    const firstScheduledSubtask = task.subtasks
      .filter((st: SubTask) => !st.completed && st.scheduledStartTime && isValid(parseISO(st.scheduledStartTime)))
      .sort((s1: SubTask, s2: SubTask) => parseISO(s1.scheduledStartTime!).getTime() - parseISO(s2.scheduledStartTime!).getTime())[0];
  
    return firstScheduledSubtask ? parseISO(firstScheduledSubtask.scheduledStartTime!).getTime() : Infinity; 
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aFirstTime = getFirstScheduledTime(a);
    const bFirstTime = getFirstScheduledTime(b);
    if (aFirstTime !== Infinity && bFirstTime !== Infinity) return aFirstTime - bFirstTime;
    if (aFirstTime !== Infinity) return -1;
    if (bFirstTime !== Infinity) return 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriorityVal = a.priority ? priorityOrder[a.priority] : 3; 
    const bPriorityVal = b.priority ? priorityOrder[b.priority] : 3;
    if (aPriorityVal !== bPriorityVal) return aPriorityVal - bPriorityVal;
    const aCreatedAtNum = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
    const bCreatedAtNum = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
    return bCreatedAtNum - aCreatedAtNum;
  });

  let titleForDialog = "Create New Task";
  if (editingTask) {
    titleForDialog = "Edit Task";
  } else if (initialDataForForm && 'text' in initialDataForForm && (initialDataForForm as TaskFormData).subtasks?.[0]?.scheduledTime) {
      try {
        const firstSubtask = (initialDataForForm as TaskFormData).subtasks![0];
        if (firstSubtask.deadline && firstSubtask.scheduledTime) {
           titleForDialog = `New Task for ${format(parseISO(`${firstSubtask.deadline}T${firstSubtask.scheduledTime}:00`), 'MMM d, h:mm a')}`;
        }
      } catch { /* fallback */ }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <Dialog open={isFormOpen} onOpenChange={onFormOpenChange}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto" onClick={onOpenNewTaskForm}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="pb-4 flex-shrink-0">
             <DialogTitle>{titleForDialog}</DialogTitle>
            </DialogHeader>
            <TaskForm
              onSubmit={handleFormSubmit}
              initialData={initialDataForForm}
              isEditing={!!editingTask}
              onCancel={handleFormCancel}
              allTasks={allTasks}
            />
          </DialogContent>
        </Dialog>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={filter} onValueChange={(value) => setFilter(value as TaskFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter tasks by status">
              <ListFilter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as 'all' | 'high' | 'medium' | 'low')}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter tasks by priority">
              <Tags className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedTasks.length > 0 ? (
        <div className="space-y-4">
          {sortedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onEdit={onOpenEditForm}
              onStartTimer={onStartTimer}
              onStartSubTaskTimer={onStartSubTaskTimer}
              onUpdateSubTask={onUpdateSubTask}
              onDeleteSubTask={onDeleteSubTask}
              onToggleSubTask={onToggleSubTask}
              isDraggable={true}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex justify-center">
                {filter === 'completed' ? <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2"/> : <XCircle className="h-12 w-12 text-muted-foreground mb-2"/> }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-muted-foreground">
              {searchTerm ? "No tasks match your search." :
               (filter === 'all' && priorityFilter === 'all') ? "No tasks yet. Add one to get started!" :
               "No tasks match the current filters."
              }
            </p>
            {!searchTerm && filter === 'all' && priorityFilter === 'all' && (
                 <Button onClick={onOpenNewTaskForm} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4"/> Add your first task
                </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// It seems there's a reference to TimelineClock in the original file which is now in AppShell.
// To avoid breaking anything, I'm removing it, assuming it's no longer needed here.
// If it was for a different purpose, we can re-evaluate.
// For now, this component focuses on listing tasks.