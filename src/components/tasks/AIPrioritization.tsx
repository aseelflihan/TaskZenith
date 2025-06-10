
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { getPrioritizedTasks } from '@/lib/actions'; // Server Action
import { useToast } from "@/hooks/use-toast";

interface AIPrioritizationProps {
  tasks: Task[];
  onPrioritizationComplete?: (prioritizedTaskTexts: string[], reasoning: string) => void;
}

export function AIPrioritization({ tasks, onPrioritizationComplete }: AIPrioritizationProps) {
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prioritizedResult, setPrioritizedResult] = useState<{ tasks: string[]; reasoning: string } | null>(null);
  const { toast } = useToast();

  const handlePrioritize = async () => {
    if (tasks.length === 0) {
      toast({
        title: "No Tasks",
        description: "Please add some tasks before trying to prioritize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPrioritizedResult(null);
    try {
      const result = await getPrioritizedTasks(tasks, context);
      if (result.error) {
        toast({
          title: "Error Prioritizing Tasks",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.prioritizedTasks && result.reasoning) {
        setPrioritizedResult({ tasks: result.prioritizedTasks, reasoning: result.reasoning });
        onPrioritizationComplete?.(result.prioritizedTasks, result.reasoning);
        toast({
          title: "Tasks Prioritized",
          description: "AI has suggested a new task order.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while prioritizing tasks.",
        variant: "destructive",
      });
      console.error("Prioritization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary h-6 w-6" /> AI Task Prioritization</CardTitle>
        <CardDescription>Let AI help you decide what to focus on next. Provide any additional context below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Optional context (e.g., 'Client X deadline is approaching', 'Focus on quick wins today')"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
        />
        <Button onClick={handlePrioritize} disabled={isLoading || tasks.length === 0} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          Prioritize My Tasks
        </Button>
      </CardContent>
      {prioritizedResult && (
        <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
           <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>AI Suggestion</AlertTitle>
            <AlertDescription>
              <h4 className="font-semibold mt-2 mb-1">Prioritized Order:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {prioritizedResult.tasks.map((taskText, index) => (
                  <li key={index}>{taskText}</li>
                ))}
              </ul>
              <h4 className="font-semibold mt-3 mb-1">Reasoning:</h4>
              <p className="text-sm">{prioritizedResult.reasoning}</p>
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
