
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, FileText, Loader2, Info } from 'lucide-react';
import type { Task } from '@/lib/types';
import { getProductivityReport } from '@/lib/actions'; // Server Action
import { useToast } from "@/hooks/use-toast";

interface ProductivityReportDisplayProps {
  tasks: Task[];
}

export function ProductivityReportDisplay({ tasks: initialTasks }: ProductivityReportDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<{ analysis: string; recommendations: string } | null>(null);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks); // Update tasks if prop changes
  }, [initialTasks]);

  const handleGenerateReport = async () => {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) {
      toast({
        title: "No Completed Tasks",
        description: "Please complete some tasks to generate a productivity report.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setReport(null);
    try {
      const result = await getProductivityReport(tasks);
      if (result.error) {
        toast({
          title: "Error Generating Report",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.analysis && result.recommendations) {
        setReport({ analysis: result.analysis, recommendations: result.recommendations });
        toast({
          title: "Report Generated",
          description: "AI has analyzed your productivity.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the report.",
        variant: "destructive",
      });
      console.error("Report generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary h-6 w-6" /> AI Productivity Report</CardTitle>
        <CardDescription>Get insights into your work patterns and suggestions for improvement based on your completed tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGenerateReport} disabled={isLoading || tasks.filter(t => t.completed).length === 0} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Report
        </Button>
        {!report && !isLoading && tasks.filter(t => t.completed).length === 0 && (
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>No Data Yet</AlertTitle>
            <AlertDescription>
              Complete some tasks, then generate a report to see your productivity analysis.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {report && (
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
          <Alert variant="default">
            <BarChart3 className="h-4 w-4" />
            <AlertTitle className="font-semibold text-lg">Productivity Analysis</AlertTitle>
            <AlertDescription>
              <div className="prose prose-sm dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: report.analysis.replace(/\n/g, '<br />') }} />
            </AlertDescription>
          </Alert>
          <Alert variant="default">
             <BarChart3 className="h-4 w-4" />
            <AlertTitle className="font-semibold text-lg">Recommendations</AlertTitle>
            <AlertDescription>
              <div className="prose prose-sm dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: report.recommendations.replace(/\n/g, '<br />') }} />
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
