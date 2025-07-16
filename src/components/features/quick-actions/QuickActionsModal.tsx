// src/components/features/quick-actions/QuickActionsModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuickTask, TaskGroup } from "@/types/quick-task";
import { useState, useEffect, KeyboardEvent, useMemo } from "react";
import { saveTaskGroupsAction, getTaskGroupsAction } from "@/lib/actions/quick-tasks.actions";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'; // Use closestCorners for better group detection
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from "./SortableTaskItem";
import { Loader2, FolderPlus, Sparkles, Plus, Trash2 } from "lucide-react"; // Import Trash2
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from 'use-debounce';

// Component for rendering a single group
function SortableGroup({ group, onDeleteGroup, onAddTask, taskHandlers }: { group: TaskGroup; onDeleteGroup: (groupId: string) => void; onAddTask: (groupId: string, text: string) => void; taskHandlers: any }) {
  const [newTaskText, setNewTaskText] = useState("");
  const handleAddTask = () => { if (newTaskText.trim()) { onAddTask(group.id, newTaskText.trim()); setNewTaskText(""); } };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleAddTask(); };

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-200">{group.title}</h3>
        {/* --- NEW: Delete Group Button --- */}
        <Button variant="ghost" size="icon" onClick={() => onDeleteGroup(group.id)} aria-label={`Delete group ${group.title}`}>
          <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
        </Button>
      </div>
      <SortableContext items={group.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[20px]"> {/* min-h to ensure it's a valid drop target even when empty */}
          {group.tasks.map(task => <SortableTaskItem key={task.id} task={task} {...taskHandlers} />)}
        </div>
      </SortableContext>
      <div className="relative mt-3"><Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><Input placeholder="Add a task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleKeyDown} className="pl-9" /></div>
    </div>
  );
}

// Main Modal Component
interface QuickActionsModalProps { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }
export function QuickActionsModal({ isOpen, onOpenChange }: QuickActionsModalProps) {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  type View = 'list' | 'ai_input';
  const [view, setView] = useState<View>('list');

  const debouncedSave = useDebouncedCallback((newGroups: TaskGroup[]) => { saveTaskGroupsAction(newGroups).catch(err => console.error("Autosave failed:", err)); }, 1500);

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      getTaskGroupsAction().then(existingGroups => {
        if (existingGroups.length === 0) { setView('ai_input'); } 
        else { setGroups(existingGroups); setView('list'); }
      }).catch(err => { console.error("Failed to fetch groups:", err); setView('ai_input'); })
      .finally(() => setIsFetching(false));
    }
  }, [isOpen]);

  useEffect(() => { if (!isFetching) { debouncedSave(groups); } }, [groups, isFetching, debouncedSave]);

  const allItemIds = useMemo(() => [ ...groups.map(g => g.id), ...groups.flatMap(g => g.tasks.map(t => t.id)) ], [groups]);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // --- NEW: Rewritten handleDragEnd to support cross-group dragging ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;
  
    const activeIsTask = !groups.some(g => g.id === activeId);
    if (!activeIsTask) return; // We are not dragging groups for now
  
    setGroups(prev => {
      let newGroups = JSON.parse(JSON.stringify(prev));
      const sourceGroup = newGroups.find((g: TaskGroup) => g.tasks.some(t => t.id === activeId));
      if (!sourceGroup) return prev;
  
      const taskIndex = sourceGroup.tasks.findIndex((t: QuickTask) => t.id === activeId);
      const [movedTask] = sourceGroup.tasks.splice(taskIndex, 1);
  
      const overIsGroupContainer = newGroups.some((g: TaskGroup) => g.id === overId);
      let destGroup;
      let newIndex;
  
      if (overIsGroupContainer) {
        destGroup = newGroups.find((g: TaskGroup) => g.id === overId);
        newIndex = destGroup.tasks.length; // Add to the end of the group
      } else {
        destGroup = newGroups.find((g: TaskGroup) => g.tasks.some(t => t.id === overId));
        if (!destGroup) return prev; // Should not happen
        newIndex = destGroup.tasks.findIndex((t: QuickTask) => t.id === overId);
      }
  
      destGroup.tasks.splice(newIndex, 0, movedTask);
  
      // Re-order all tasks within their groups
      newGroups.forEach((g: TaskGroup) => g.tasks.forEach((t: QuickTask, i: number) => t.order = i));
      return newGroups;
    });
  };

  const taskHandlers = {
    onToggleTask: (taskId: string) => setGroups(g => g.map(gr => ({ ...gr, tasks: gr.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) }))),
    onUpdateTaskText: (taskId: string, newText: string) => setGroups(g => g.map(gr => ({ ...gr, tasks: gr.tasks.map(t => t.id === taskId ? { ...t, text: newText } : t) }))),
    onSetTaskColor: (taskId: string, color: string) => setGroups(g => g.map(gr => ({ ...gr, tasks: gr.tasks.map(t => t.id === taskId ? { ...t, color } : t) }))),
    onDeleteTask: (taskId: string) => setGroups(g => g.map(gr => ({ ...gr, tasks: gr.tasks.filter(t => t.id !== taskId) }))),
  };

  const handleAddTask = (groupId: string, text: string) => setGroups(g => g.map(gr => gr.id === groupId ? { ...gr, tasks: [...gr.tasks, { id: crypto.randomUUID(), text, completed: false, order: gr.tasks.length }] } : gr));
  const handleAddGroup = () => { const name = prompt("New group name:"); if (name && name.trim()) setGroups(g => [...g, { id: crypto.randomUUID(), title: name, tasks: [] }]); };
  
  // --- NEW: Handler to delete a group ---
  const handleDeleteGroup = (groupId: string) => { if(confirm("Are you sure you want to delete this group and all its tasks?")) { setGroups(g => g.filter(gr => gr.id !== groupId)); }};
  
  // --- NEW: Handler to clear everything ---
  const handleClearAll = () => { if(confirm("Are you sure you want to delete ALL groups and tasks?")) { setGroups([]); setView('ai_input'); }};
  
  const handleParseText = async () => {
    setIsParsing(true);
    try {
      const response = await fetch('/api/quick-actions/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: aiText }) });
      const responseData = await response.json();
      if (response.ok) {
        const mainTask = responseData[0];
        if (mainTask && Array.isArray(mainTask.subtasks) && mainTask.subtasks.length > 0) {
          const newTasks = mainTask.subtasks.map((sub: { text: string }, i: number) => ({ id: crypto.randomUUID(), text: sub.text, completed: false, order: i }));
          const newGroup: TaskGroup = { id: crypto.randomUUID(), title: mainTask.text || "AI Generated Tasks", tasks: newTasks };
          setGroups(g => [...g, newGroup]);
          setAiText("");
          setView('list');
        }
      } else { console.error("AI Parse Error:", responseData); }
    } catch (error) { console.error("Fetch AI Error:", error); }
    finally { setIsParsing(false); }
  };

  const renderContent = () => {
    if (isFetching) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>;
    if (view === 'ai_input') {
      return (
        <div className="space-y-4 py-4">
          <Textarea placeholder="e.g., plan a trip to Japan, buy groceries for the week, clean the house..." value={aiText} onChange={(e) => setAiText(e.target.value)} rows={5} />
          <div className="flex justify-end space-x-2">
            {groups.length > 0 && <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>}
            <Button onClick={handleParseText} disabled={isParsing || !aiText.trim()}>{isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Organize with AI</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4 py-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
              {groups.map(group => <SortableGroup key={group.id} group={group} onDeleteGroup={handleDeleteGroup} onAddTask={handleAddTask} taskHandlers={taskHandlers} />)}
            </SortableContext>
          </div>
        </DndContext>
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddGroup}><FolderPlus className="mr-2 h-4 w-4" /> Add Group</Button>
            <Button variant="ghost" onClick={() => setView('ai_input')}><Sparkles className="mr-2 h-4 w-4" /> Add with AI</Button>
          </div>
          {/* --- NEW: Clear All button --- */}
          <Button variant="destructive" onClick={handleClearAll}>Clear All</Button>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl min-h-[50vh]">
        <DialogHeader><DialogTitle>Quick Actions</DialogTitle></DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}