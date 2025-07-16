// src/components/features/quick-actions/SortableTaskItem.tsx
"use client";

import { useState } from 'react';
import { QuickTask } from "@/types/quick-task";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GripVertical, Palette, Trash2 } from "lucide-react";

interface SortableTaskItemProps {
  task: QuickTask;
  onToggleTask: (id: string) => void;
  onUpdateTaskText: (id: string, text: string) => void;
  onSetTaskColor: (id: string, color: string) => void;
  onDeleteTask: (id: string) => void;
}

export function SortableTaskItem({ task, onToggleTask, onUpdateTaskText, onSetTaskColor, onDeleteTask }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleSaveEdit = () => {
    onUpdateTaskText(task.id, editText);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded-lg group">
      <div {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-200 transition-colors">
        <GripVertical className="h-5 w-5" />
      </div>
      <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => onToggleTask(task.id)} />
      {isEditing ? (
        <Input value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={handleSaveEdit} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} autoFocus className="flex-grow bg-transparent border-slate-600 focus:ring-slate-500" />
      ) : (
        <label htmlFor={`task-${task.id}`} onClick={() => setIsEditing(true)} className={`flex-grow cursor-pointer ${task.completed ? 'line-through text-slate-500' : ''}`} style={{ color: task.color }}>
          {task.text}
        </label>
      )}
      <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Change color" className="opacity-50 group-hover:opacity-100 transition-opacity">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="grid grid-cols-5 gap-2">
            {['#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#51cf66', '#fcc419'].map(color => (
              <button key={color} onClick={() => { onSetTaskColor(task.id, color); setIsColorPickerOpen(false); }} className="h-6 w-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" style={{ backgroundColor: color }} aria-label={`Set color to ${color}`} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)} aria-label="Delete task" className="opacity-50 group-hover:opacity-100 transition-opacity">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}