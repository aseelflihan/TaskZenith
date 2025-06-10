"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, AlertTriangle } from 'lucide-react';
import { generateTasksFromNaturalLanguage } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import type { TaskFormData } from "./TaskForm";
import type { Task } from '@/lib/types'; // Import Task type
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- CHANGED: Added 'existingTasks' prop ---
interface AIChatTaskGeneratorProps {
  onTasksGenerated: (tasksData: TaskFormData[]) => void;
  existingTasks: Task[];
}

export function AIChatTaskGenerator({ onTasksGenerated, existingTasks }: AIChatTaskGeneratorProps) {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      setError("Please enter a description for your tasks.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // --- CHANGED: Pass existingTasks to the server action ---
      const result = await generateTasksFromNaturalLanguage(userInput, existingTasks);

      if (result.error) {
        setError(result.error);
        toast({
          title: "AI Task Generation Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.tasksData && result.tasksData.length > 0) {
        onTasksGenerated(result.tasksData);
        toast({
          title: "Tasks Added by AI",
          description: `Successfully generated and added ${result.tasksData.length} new task group(s).`,
        });
        setUserInput("");
      } else {
        setError("The AI could not identify any tasks from your input. Please try rephrasing.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="text-primary h-6 w-6" /> AI Task Generator
        </CardTitle>
        <CardDescription>
          Describe your tasks in plain language. The AI will group them and schedule them after your last existing task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Example: review physics unit 1 and 2 for an hour each. Also, I have a meeting with the client tomorrow at 4pm..."
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            if (error) setError(null);
          }}
          rows={5}
          aria-label="Describe your tasks for AI generation"
        />
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          Generate & Add Tasks
        </Button>
      </CardFooter>
    </Card>
  );
}