// src/components/features/quick-actions/QuickActionsModal.tsx

"use client";

// ... (جميع الـ imports تبقى كما هي)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuickTask } from "@/types/quick-task";
import { useState } from "react";
import { saveQuickTasksAction } from "@/lib/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Palette, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// ... (مكون SortableTaskItem يبقى كما هو بدون تغيير)
interface SortableTaskItemProps {
  task: QuickTask;
  onToggle: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onSetColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

function SortableTaskItem({ task, onToggle, onUpdateText, onSetColor, onDelete }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const handleSaveEdit = () => {
    onUpdateText(task.id, editText);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded-md">
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <Checkbox checked={task.completed} onCheckedChange={() => onToggle(task.id)} />
      {isEditing ? (
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
          autoFocus
          className="flex-grow"
        />
      ) : (
        <span onClick={() => setIsEditing(true)} className={`flex-grow ${task.completed ? 'line-through' : ''}`} style={{ color: task.color }}>
          {task.text}
        </span>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Palette className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex space-x-1">
            {['#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#51cf66', '#fcc419'].map(color => (
              <div key={color} onClick={() => onSetColor(task.id, color)} className="h-6 w-6 rounded-full cursor-pointer" style={{ backgroundColor: color }} />
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}


interface QuickActionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function QuickActionsModal({ isOpen, onOpenChange }: QuickActionsModalProps) {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleParseText = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quick-actions/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const responseData = await response.json();
      
      // FINAL DIAGNOSTIC LOG: Let's see what the frontend receives
      console.log("[CLIENT] Received raw data from server:", JSON.stringify(responseData, null, 2));

      if (response.ok) {
        // --- THIS IS THE CORRECTED LOGIC ---
        // The API returns an array like [{ text: 'Main Title', subtasks: [...] }]
        // We need to extract the subtasks from the FIRST element of the array.
        
        const mainTask = responseData[0];
        if (mainTask && Array.isArray(mainTask.subtasks)) {
          const extractedSubtasks = mainTask.subtasks;

          setTasks(
            extractedSubtasks.map((subtask: { text: string }, index: number) => ({
              id: crypto.randomUUID(),
              text: subtask.text,
              completed: false,
              order: index,
              color: undefined,
            }))
          );
        } else {
            // Fallback for simple cases where the API might just return an array of tasks
            const rawTasks: { text: string; [key: string]: any }[] = responseData;
            setTasks(
              rawTasks.map((task, index) => ({
                id: crypto.randomUUID(),
                text: task.text,
                completed: false,
                order: index,
                color: undefined,
              }))
            );
        }
        // --- END OF CORRECTED LOGIC ---
        
      } else {
        console.error("Failed to parse tasks. Server responded with:", responseData);
      }
    } catch (error) {
      console.error("Error parsing tasks (network or JSON issue):", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... (بقية الملف لم يتغير)
  const handleSaveTasks = async () => {
    try {
      await saveQuickTasksAction(tasks);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };
  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  const handleUpdateTaskText = (id: string, newText: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, text: newText } : task));
  };
  const handleSetTaskColor = (id: string, color: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, color } : task));
  };
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>
        {tasks.length === 0 ? (
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., مراجعة بريد العملاء وتصميم بانر لحملة الخميس"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
            <Button onClick={handleParseText} disabled={isLoading || !text.trim()}>
              {isLoading ? "Processing..." : "Organize with AI"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onUpdateText={handleUpdateTaskText}
                      onSetColor={handleSetTaskColor}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTasks([])}>Start Over</Button>
              <Button onClick={handleSaveTasks}>Save Tasks</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}