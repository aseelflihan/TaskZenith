// src/components/features/quick-actions/QuickActionsModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuickTask, TaskGroup } from "@/types/quick-task";
import { useState, useEffect, KeyboardEvent, useMemo } from "react";
import { saveTaskGroupsAction, getTaskGroupsAction } from "@/lib/actions/quick-tasks.actions";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from "./SortableTaskItem";
import { Loader2, FolderPlus, Sparkles, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from 'use-debounce';
import * as LucideIcons from "lucide-react";
// --- NEW: Import AlertDialog for better confirmation dialogs ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// --- Icon Picker Component (No changes) ---
const availableIcons = ["Briefcase", "Home", "Plane", "Book", "Code", "Heart"] as const;
type IconName = typeof availableIcons[number];
const IconPicker = ({ selected, onSelectIcon }: { selected: IconName, onSelectIcon: (iconName: IconName) => void }) => (
  <div className="flex gap-2 p-1 bg-slate-900 rounded-md">
    {availableIcons.map(iconName => {
      const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
      return <Button key={iconName} variant={selected === iconName ? "secondary" : "ghost"} size="icon" onClick={() => onSelectIcon(iconName)}><Icon className="h-4 w-4" /></Button>;
    })}
  </div>
);

// --- New Group Form Component (No changes) ---
function NewGroupForm({ onSave, onCancel }: { onSave: (title: string, icon: IconName) => void, onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("Briefcase");
  return (
    <div className="p-4 bg-slate-800 rounded-lg space-y-3">
      <Input placeholder="New group name..." value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <IconPicker selected={selectedIcon} onSelectIcon={setSelectedIcon} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
        <Button onClick={() => title.trim() && onSave(title.trim(), selectedIcon)} className="w-full sm:w-auto">Save Group</Button>
      </div>
    </div>
  );
}

// --- NEW: Placeholder component for empty groups to enable dropping ---
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function EmptyGroupPlaceholder({ id }: { id: string }) {
    const { setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        height: '50px', // Give it some height to be a valid drop target
        border: '2px dashed #374151', // slate-700
        borderRadius: '0.5rem', // rounded-lg
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800 with 50% opacity
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b', // slate-500
        marginTop: '0.5rem',
    };
    return <div ref={setNodeRef} style={style}>Drop a task here</div>;
}

function SortableGroup({ group, onDeleteGroup, onAddTask, taskHandlers }: { group: TaskGroup; onDeleteGroup: (groupId: string) => void; onAddTask: (groupId: string, text: string) => void; taskHandlers: any }) {
  const [newTaskText, setNewTaskText] = useState("");
  const handleAddTask = () => { if (newTaskText.trim()) { onAddTask(group.id, newTaskText.trim()); setNewTaskText(""); } };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleAddTask(); };
  const Icon = LucideIcons[group.icon as keyof typeof LucideIcons] as React.ElementType || LucideIcons.Briefcase;
  
  const placeholderId = `placeholder-${group.id}`;
  const sortableItems = useMemo(() => {
    const taskIds = group.tasks.map(t => t.id);
    return taskIds.length > 0 ? taskIds : [placeholderId];
  }, [group.tasks, group.id, placeholderId]);

  return (
    <div id={group.id} className="p-4 bg-slate-800/50 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-slate-400" /><h3 className="font-bold text-lg text-slate-200">{group.title}</h3></div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Delete group ${group.title}`}><Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the "{group.title}" group and all its tasks. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteGroup(group.id)}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[20px]">
          {group.tasks.map(task => <SortableTaskItem key={task.id} task={task} {...taskHandlers} />)}
          {group.tasks.length === 0 && <EmptyGroupPlaceholder id={placeholderId} />}
        </div>
      </SortableContext>
      <div className="relative mt-3"><Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><Input placeholder="Add a task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleKeyDown} className="pl-9" /></div>
    </div>
  );
}

// --- REBUILT: Main Modal Component ---
interface QuickActionsModalProps { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }
export function QuickActionsModal({ isOpen, onOpenChange }: QuickActionsModalProps) {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  type View = 'list' | 'ai_input';
  const [view, setView] = useState<View>('list');
  const debouncedSave = useDebouncedCallback((newGroups: TaskGroup[]) => { saveTaskGroupsAction(newGroups).catch(err => console.error("Autosave failed:", err)); }, 1500);
  
  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      getTaskGroupsAction().then(existingGroups => {
        setGroups(existingGroups);
        setView(existingGroups.length === 0 ? 'ai_input' : 'list');
      }).catch(err => { console.error("Failed to fetch groups:", err); setView('ai_input'); })
      .finally(() => setIsFetching(false));
    } else { setIsAddingGroup(false); }
  }, [isOpen]);
  
  useEffect(() => { if (!isFetching) debouncedSave(groups); }, [groups, isFetching, debouncedSave]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  
  // --- FINAL: Rewritten handleDragEnd to be robust and reliable ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeIdStr = active.id as string;
    let overIdStr = over.id as string;
    if (activeIdStr === overIdStr) return;

    setGroups((prev) => {
      const sourceGroupIndex = prev.findIndex(g => g.tasks.some(t => t.id === activeIdStr));
      if (sourceGroupIndex === -1) return prev; // Task not found

      const taskIndex = prev[sourceGroupIndex].tasks.findIndex(t => t.id === activeIdStr);
      const movedTask = prev[sourceGroupIndex].tasks[taskIndex];

      // --- FIX: Correctly identify the destination group, even if it's empty ---
      const overIsPlaceholder = overIdStr.startsWith('placeholder-');
      const overGroupId = overIsPlaceholder ? overIdStr.replace('placeholder-', '') : overIdStr;
      
      let destGroupIndex = prev.findIndex(g => g.id === overGroupId || g.tasks.some(t => t.id === overGroupId));
      if (destGroupIndex === -1) return prev; // Drop target group not found

      const newGroups = JSON.parse(JSON.stringify(prev));
      
      // Remove from source
      newGroups[sourceGroupIndex].tasks.splice(taskIndex, 1);
      
      // Add to destination
      const overIsGroupContainer = prev[destGroupIndex].id === overGroupId;
      const overIsTask = prev[destGroupIndex].tasks.some(t => t.id === overGroupId);

      let destTaskIndex = newGroups[destGroupIndex].tasks.length; // Default to end of list
      if (overIsTask) {
        destTaskIndex = newGroups[destGroupIndex].tasks.findIndex((t: QuickTask) => t.id === overGroupId);
      }
      
      newGroups[destGroupIndex].tasks.splice(destTaskIndex, 0, movedTask);
      
      // Re-order all tasks
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
  const handleAddGroup = (title: string, icon: IconName) => { setGroups(g => [...g, { id: crypto.randomUUID(), title, icon, tasks: [] }]); setIsAddingGroup(false); };
  const handleDeleteGroup = (groupId: string) => setGroups(g => g.filter(gr => gr.id !== groupId));
  const handleClearAll = () => { setGroups([]); setView('ai_input'); };

  const handleParseText = async () => {
    setIsParsing(true);
    try {
      const response = await fetch('/api/quick-actions/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: aiText }) });
      const responseData = await response.json();
      if (response.ok) {
        const mainTask = responseData[0];
        if (mainTask && Array.isArray(mainTask.subtasks) && mainTask.subtasks.length > 0) {
          const newTasks = mainTask.subtasks.map((sub: { text: string }, i: number) => ({ id: crypto.randomUUID(), text: sub.text, completed: false, order: i }));
          const newGroup: TaskGroup = { id: crypto.randomUUID(), title: mainTask.text || "AI Generated Tasks", icon: "Sparkles", tasks: newTasks };
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
          <Textarea placeholder="e.g., plan a trip to Japan including booking flights and hotels, buy groceries for the week..." value={aiText} onChange={(e) => setAiText(e.target.value)} rows={5} />
          <div className="flex justify-end space-x-2">
            {groups.length > 0 && <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>}
            <Button onClick={handleParseText} disabled={isParsing || !aiText.trim()}>{isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Organize with AI</Button>
          </div>
        </div>
      );
    }
    // List view only returns the scrollable content
    return (
      <div className="flex-grow overflow-y-auto min-h-0 pr-2 pt-4 custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {groups.map(group => <SortableGroup key={group.id} group={group} onDeleteGroup={handleDeleteGroup} onAddTask={handleAddTask} taskHandlers={taskHandlers} />)}
            {isAddingGroup && <NewGroupForm onSave={handleAddGroup} onCancel={() => setIsAddingGroup(false)} />}
          </div>
        </DndContext>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl top-[5vh] bottom-[5vh] translate-y-0 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:h-auto sm:max-h-[80vh] sm:min-h-[50vh] sm:w-full pt-12 pb-6 flex flex-col">
        <DialogHeader><DialogTitle>Quick Actions</DialogTitle></DialogHeader>
        {renderContent()}
        {/* Footer is now outside renderContent and will be fixed at the bottom */}
        {view === 'list' && !isFetching && (
          <div className="flex-shrink-0 flex flex-row flex-wrap justify-between items-center pt-4 border-t border-slate-800 gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddingGroup(true)} disabled={isAddingGroup}>
                <FolderPlus className="mr-2 h-4 w-4" /> Add Group
              </Button>
              <Button variant="ghost" onClick={() => setView('ai_input')}>
                <Sparkles className="mr-2 h-4 w-4" /> Add with AI
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Clear All</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete ALL groups and tasks. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>Yes, Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}