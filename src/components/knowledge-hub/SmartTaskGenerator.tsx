"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Plus
} from "lucide-react";
import { KnowledgeItem } from "@/lib/types";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { addKnowledgeHubTasksAction } from "@/lib/actions/knowledge-hub.actions";
import { useToast } from "@/hooks/use-toast";

interface SmartTaskGeneratorProps {
  knowledgeItem: KnowledgeItem;
  onTasksAdded: () => void;
}

export function SmartTaskGenerator({ knowledgeItem, onTasksAdded }: SmartTaskGeneratorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState(knowledgeItem.tasks);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Analyze content type to customize tasks
  const analyzeContent = () => {
    const content = `${knowledgeItem.title} ${knowledgeItem.summary} ${knowledgeItem.tags.join(' ')}`.toLowerCase();
    
    const isEvent = knowledgeItem.tags.some(tag => 
      /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp/i.test(tag)
    );
    
    const isAcademic = knowledgeItem.tags.some(tag =>
      /academic|أكاديمي|university|جامعة|course|دورة|study|دراسة/i.test(tag)
    );
    
    const isProject = knowledgeItem.tags.some(tag =>
      /project|مشروع|development|تطوير|coding|برمجة/i.test(tag)
    );

    return { isEvent, isAcademic, isProject, content };
  };

  const { isEvent, isAcademic, isProject, content } = analyzeContent();

  // Generate additional smart tasks based on content type
  const generateSmartTasks = () => {
    const existingTasks = [...generatedTasks];
    const smartTasks = [];

    if (isEvent) {
      // Event-specific tasks
      if (!existingTasks.some(t => /تسجيل|register/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Register for: ${knowledgeItem.title}`,
          completed: false
        });
      }
      
      if (!existingTasks.some(t => /تحضير|prepare/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Prepare for: ${knowledgeItem.title}`,
          completed: false
        });
      }
      
      if (!existingTasks.some(t => /متابعة|follow.*up/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Follow up after: ${knowledgeItem.title}`,
          completed: false
        });
      }
    }

    if (isAcademic) {
      // Academic tasks
      if (!existingTasks.some(t => /مراجعة|review/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Review content: ${knowledgeItem.title}`,
          completed: false
        });
      }
      
      if (!existingTasks.some(t => /ملاحظات|notes/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Take notes on: ${knowledgeItem.title}`,
          completed: false
        });
      }
    }

    if (isProject) {
      // Development tasks
      if (!existingTasks.some(t => /خطة|plan/i.test(t.text))) {
        smartTasks.push({
          id: crypto.randomUUID(),
          text: `Create implementation plan for: ${knowledgeItem.title}`,
          completed: false
        });
      }
    }

    if (smartTasks.length > 0) {
      setGeneratedTasks([...existingTasks, ...smartTasks]);
    }
    
    setShowPreview(true);
  };

  // Extract dates from content
  const extractDates = () => {
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|[A-Za-z]+ \d{1,2},? \d{4})/g;
    const dates = content.match(datePattern) || [];
    return dates.slice(0, 2); // First two dates only
  };

  // Extract locations from content
  const extractLocations = () => {
    const locationWords = content.match(/university|جامعة|hall|قاعة|center|مركز|hotel|فندق|campus|حرم/gi) || [];
    return locationWords.slice(0, 2);
  };

  const dates = extractDates();
  const locations = extractLocations();

  const getContentTypeIcon = () => {
    if (isEvent) return <Calendar className="h-5 w-5 text-blue-600" />;
    if (isAcademic) return <Users className="h-5 w-5 text-green-600" />;
    if (isProject) return <Sparkles className="h-5 w-5 text-purple-600" />;
    return <CheckCircle2 className="h-5 w-5 text-gray-600" />;
  };

  const getContentTypeLabel = () => {
    if (isEvent) return "Event or Activity";
    if (isAcademic) return "Academic Content";
    if (isProject) return "Technical Project";
    return "General Content";
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getContentTypeIcon()}
          Smart Task Generator
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getContentTypeLabel()}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {generatedTasks.length} tasks available
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Context Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {dates.length > 0 && (
            <div className="flex items-center gap-2 text-blue-600">
              <Calendar className="h-4 w-4" />
              <span className="truncate">{dates[0]}</span>
            </div>
          )}
          
          {locations.length > 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{locations[0]}</span>
            </div>
          )}
        </div>

        {/* Current Tasks */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Suggested Tasks:</h4>
          <div className="space-y-1">
            {generatedTasks.slice(0, 3).map((task, index) => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="truncate">{task.text}</span>
              </div>
            ))}
            
            {generatedTasks.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{generatedTasks.length - 3} more tasks...
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={generateSmartTasks}
            className="flex-1"
            variant="default"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Smart Tasks
          </Button>
          
          {generatedTasks.length > 0 && (
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Smart Hints */}
        {isEvent && dates.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Event date detected. Appropriate deadlines will be set for tasks.
            </div>
          </div>
        )}

        {isAcademic && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-700 dark:text-green-300">
              <strong>Tip:</strong> Academic content. Tasks for review and note-taking will be added.
            </div>
          </div>
        )}
      </CardContent>

      {/* Task Review Modal */}
      <TaskPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        knowledgeItem={{ ...knowledgeItem, tasks: generatedTasks }}
        isLoading={isAdding}
        onConfirm={async (tasks) => {
          if (tasks.length === 0) return;
          setIsAdding(true);
          try {
            const enhancedItem = {
              ...knowledgeItem,
              tasks: tasks.map(task => ({
                id: task.id,
                text: task.text,
                completed: false,
                deadline: task.deadline,
                priority: task.priority,
                durationMinutes: task.durationMinutes,
              }))
            };
            const result = await addKnowledgeHubTasksAction(enhancedItem);
            if (result.success && result.details?.dashboardAppearance) {
              toast({
                title: "✅ Task Added!",
                description: `"${result.details.taskText}" is now in your dashboard.`,
                action: (
                  <button
                    onClick={() => {
                      localStorage.setItem('refresh-tasks', 'true');
                      window.location.href = '/dashboard';
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  >
                    View Dashboard
                  </button>
                ),
              });
              onTasksAdded();
              setShowPreview(false);
            } else {
              throw new Error(result.error || "Failed to add task.");
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "An unknown error occurred.",
              variant: "destructive",
            });
          } finally {
            setIsAdding(false);
          }
        }}
      />
    </Card>
  );
}
