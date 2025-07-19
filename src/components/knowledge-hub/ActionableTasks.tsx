"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

interface ActionableTasksProps {
    initialTasks: Task[];
    knowledgeId: string;
}

export default function ActionableTasks({ initialTasks, knowledgeId }: ActionableTasksProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    // In a real app, this would call an AI flow and then PATCH the knowledge item
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newTasks = [
        ...tasks,
        { id: `task${tasks.length + 1}`, text: 'Review Genkit documentation', completed: false }
    ];
    setTasks(newTasks);
    setIsGenerating(false);
  };

  const handleSendToMyTasks = async () => {
    const selectedTasks = tasks.filter(t => t.completed);
    if (selectedTasks.length === 0) return;

    setIsSending(true);
    try {
      await fetch(`/api/knowledge/${knowledgeId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: selectedTasks }),
      });
      // Optionally show a success toast
    } catch (error) {
      console.error("Failed to send tasks:", error);
      // Optionally show an error toast
    } finally {
      setIsSending(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerateTasks} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
        ) : (
          "✨ Generate Tasks"
        )}
      </Button>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-2">
            <Checkbox
              id={task.id}
              checked={task.completed}
              onCheckedChange={() => toggleTaskCompletion(task.id)}
            />
            <label
              htmlFor={task.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {task.text}
            </label>
          </div>
        ))}
      </div>
      <Button onClick={handleSendToMyTasks} disabled={isSending || tasks.filter(t => t.completed).length === 0} className="w-full">
        {isSending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
        ) : (
            "Send to My Tasks"
        )}
      </Button>
    </div>
  );
}