"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit3, Plus, Trash2, Check, X, Loader2 } from "lucide-react";
import { KnowledgeItem } from "@/lib/types";

interface TaskPreview {
  id: string;
  text: string;
  selected: boolean;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  durationMinutes: number;
  notes?: string;
}

interface TaskPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeItem: KnowledgeItem;
  onConfirm: (tasks: TaskPreview[]) => void;
  isLoading?: boolean;
}

export function TaskPreviewModal({ 
  isOpen, 
  onClose, 
  knowledgeItem, 
  onConfirm,
  isLoading = false 
}: TaskPreviewModalProps) {
  const [tasks, setTasks] = useState<TaskPreview[]>(() => {
    console.log('TaskPreviewModal initializing with knowledgeItem:', knowledgeItem.title);
    console.log('KnowledgeItem full object:', knowledgeItem);
    console.log('Original content:', knowledgeItem.originalContent);
    console.log('Initial tasks from knowledge item:', knowledgeItem.tasks);
    
    // ALWAYS generate a single smart task based on the content, ignore existing tasks
    console.log('Generating fresh smart task based on current content...');
    const generatedTasks = generateSmartTasksFromContent(knowledgeItem);
    const singleTask = generatedTasks[0]; // Take the generated task
    
    const processedTask: TaskPreview = {
      id: singleTask.id,
      text: singleTask.text,
      selected: true,
      priority: determinePriority(singleTask.text, knowledgeItem),
      durationMinutes: estimateDuration(singleTask.text),
      deadline: extractDeadline(singleTask.text, knowledgeItem),
    };
    
    console.log('Processed single task for modal:', processedTask);
    return [processedTask]; // Always return array with ONE task only
  });

  // Generate smart tasks automatically if none exist - ALWAYS SINGLE TASK
  function generateSmartTasksFromContent(item: KnowledgeItem): Array<{id: string, text: string, completed: boolean}> {
    const content = `${item.title} ${item.summary} ${item.originalContent || ''} ${item.tags.join(' ')}`;
    
    console.log('Generating task from content:', content.substring(0, 200));
    
    // Clean up the title by removing "Advertisement" and other unnecessary suffixes
    const cleanTitle = item.title
      .replace(/\s*Advertisement\s*$/i, '')
      .replace(/\s*\[.*?\]\s*$/g, '')
      .replace(/\s*\(.*?\)\s*$/g, '')
      .trim();
    
    // Determine the single main task based on content type
    let taskText = '';
    
    // Check for registration/enrollment patterns first
    if (/register|registration|enroll|enrollment|apply|application/gi.test(content)) {
      if (/bootcamp|course|program|workshop|training|class/gi.test(content)) {
        const eventMatch = content.match(/([\w\s]+?)(?:\s+(?:bootcamp|course|program|workshop|training|class))/gi);
        if (eventMatch) {
          const eventName = eventMatch[0].trim();
          taskText = `Register for ${eventName}`;
        } else {
          taskText = `Register for ${cleanTitle}`;
        }
      } else {
        taskText = `Complete registration: ${cleanTitle}`;
      }
    }
    // Check for event/course attendance patterns
    else if (/attend|join|participate|bootcamp|course|workshop|training|class|seminar|webinar/gi.test(content)) {
      const eventMatch = content.match(/([\w\s]+?)(?:\s+(?:bootcamp|course|program|workshop|training|class|seminar|webinar))/gi);
      if (eventMatch) {
        const eventName = eventMatch[0].trim();
        taskText = `Attend ${eventName}`;
      } else {
        taskText = `Attend: ${cleanTitle}`;
      }
    }
    // Check for assignment/homework patterns
    else if (/assignment|homework|project|essay|report|submission|due/gi.test(content)) {
      taskText = `Complete assignment: ${cleanTitle}`;
    }
    // Check for exam/test patterns
    else if (/exam|test|quiz|assessment|evaluation/gi.test(content)) {
      taskText = `Prepare for exam: ${cleanTitle}`;
    }
    // Check for meeting patterns
    else if (/meeting|appointment|call|conference|discussion/gi.test(content)) {
      taskText = `Attend meeting: ${cleanTitle}`;
    }
    // Check for deadline/due date patterns
    else if (/deadline|due|submit|delivery|complete by/gi.test(content)) {
      taskText = `Complete task: ${cleanTitle}`;
    }
    // Event patterns from tags or content
    else {
      const isEvent = item.tags.some(tag => 
        /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp|festival/i.test(tag)
      ) || /festival|event|conference|seminar|workshop|meeting/i.test(content);
      
      const isAcademic = item.tags.some(tag =>
        /academic|أكاديمي|university|جامعة|course|دورة|study|دراسة|research|methodology/i.test(tag)
      ) || /research|methodology|academic|study|university/i.test(content);
      
      if (isEvent) {
        if (/festival|مهرجان|celebration|احتفال/i.test(content)) {
          taskText = `Participate in festival: ${cleanTitle}`;
        } else if (/meeting|اجتماع|session|جلسة/i.test(content)) {
          taskText = `Attend meeting: ${cleanTitle}`;
        } else if (/workshop|ورشة|training|تدريب/i.test(content)) {
          taskText = `Participate in workshop: ${cleanTitle}`;
        } else if (/conference|مؤتمر|summit|قمة/i.test(content)) {
          taskText = `Attend conference: ${cleanTitle}`;
        } else if (/seminar|ندوة|lecture|محاضرة/i.test(content)) {
          taskText = `Attend seminar: ${cleanTitle}`;
        } else {
          taskText = `Attend event: ${cleanTitle}`;
        }
      } else if (isAcademic) {
        if (/research/i.test(content)) {
          taskText = `Review research: ${cleanTitle}`;
        } else {
          taskText = `Complete academic work: ${cleanTitle}`;
        }
      } else {
        taskText = `Review: ${cleanTitle}`;
      }
    }
    
    console.log('Generated task text:', taskText);
    
    // Return only ONE task
    return [{
      id: crypto.randomUUID(),
      text: taskText,
      completed: false
    }];
  }

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Enhance task text based on content type - for single comprehensive task
  function enhanceTaskText(originalText: string, item: KnowledgeItem): string {
    const content = `${item.title} ${item.summary} ${item.originalContent || ''}`.toLowerCase();
    
    const isEvent = item.tags.some(tag => 
      /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp|festival/i.test(tag)
    );
    
    const isMeeting = /meeting|اجتماع|session|جلسة/i.test(content);
    const isWorkshop = /workshop|ورشة|training|تدريب/i.test(content);
    const isConference = /conference|مؤتمر|summit|قمة/i.test(content);
    const isSeminar = /seminar|ندوة|lecture|محاضرة/i.test(content);
    const isFestival = /festival|مهرجان|celebration|احتفال/i.test(content);
    const isAcademic = item.tags.some(tag => /academic|أكاديمي|university|جامعة/i.test(tag));
    
    // Create comprehensive single task based on type
    if (isEvent) {
      if (isMeeting) {
        return `Attend meeting: ${item.title}`;
      } else if (isWorkshop) {
        return `Participate in workshop: ${item.title}`;
      } else if (isConference) {
        return `Attend conference: ${item.title}`;
      } else if (isSeminar) {
        return `Attend seminar: ${item.title}`;
      } else if (isFestival) {
        return `Participate in festival: ${item.title}`;
      } else {
        return `Attend event: ${item.title}`;
      }
    } else if (isAcademic) {
      return `Complete academic work: ${item.title}`;
    } else {
      // Check if original text is already good, otherwise enhance it
      if (originalText.includes(item.title)) {
        return originalText;
      } else {
        return `Complete task: ${item.title}`;
      }
    }
  }

  // Determine priority based on task type
  function determinePriority(taskText: string, item: KnowledgeItem): 'high' | 'medium' | 'low' {
    if (/urgent|عاجل|asap|deadline|موعد نهائي/i.test(taskText)) return 'high';
    if (/register|تسجيل|deadline|important|مهم/i.test(taskText)) return 'high';
    if (/prepare|تحضير|review|مراجعة/i.test(taskText)) return 'medium';
    return 'medium';
  }

  // Estimate duration based on task type
  function estimateDuration(taskText: string): number {
    if (/register|تسجيل|quick|سريع/i.test(taskText)) return 15;
    if (/attend|حضور|meeting|اجتماع/i.test(taskText)) return 60;
    if (/prepare|تحضير|review|مراجعة/i.test(taskText)) return 30;
    if (/research|بحث|study|دراسة/i.test(taskText)) return 45;
    return 25;
  }

  // Extract deadline from content with improved date parsing
  function extractDeadline(taskText: string, item: KnowledgeItem): string | undefined {
    // Combine all available content for date extraction
    const allContent = [
      item.title,
      item.summary,
      item.originalContent || '',
      item.tags.join(' '),
      taskText
    ].join(' ');
    
    console.log('=== DATE EXTRACTION DEBUG ===');
    console.log('Item title:', item.title);
    console.log('Item originalContent:', item.originalContent);
    console.log('Full content for extraction:', allContent);
    
    // Enhanced date patterns with more specific matching
    const datePatterns = [
      // Specific emoji date format: "📅 September 7th, 2025"
      /📅\s*(\w+)\s+(\d{1,2})(st|nd|rd|th)?,?\s*(\d{4})/gi,
      
      // Date ranges like "8 - 14 July 2025" or "19 20 July 2025"
      /(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      /(\d{1,2})\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      
      // Single dates like "19 July 2025"
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      
      // Specific format: "September 7th, 2025" (without emoji)
      /(\w+)\s+(\d{1,2})(st|nd|rd|th)?,?\s*(\d{4})/gi,
      
      // Month Day Year format
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})/gi,
      
      // Short month format
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2}),?\s*(\d{4})/gi,
      
      // ISO format YYYY-MM-DD
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/g,
      
      // DD/MM/YYYY format (European)
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/g,
    ];

    let extractedDate: string | undefined;

    // Month name mapping
    const monthMap: { [key: string]: number } = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12
    };

    for (let i = 0; i < datePatterns.length; i++) {
      const pattern = datePatterns[i];
      pattern.lastIndex = 0; // Reset regex state
      
      let match;
      while ((match = pattern.exec(allContent)) !== null) {
        console.log(`Pattern ${i} found match:`, match);
        
        try {
          let day: number, month: number, year: number;
          
          if (i === 0) {
            // Handle emoji date format: "📅 September 7th, 2025"
            const monthName = match[1].toLowerCase();
            day = parseInt(match[2]);
            year = parseInt(match[4]);
            month = monthMap[monthName];
            
            console.log('Emoji pattern - Month:', monthName, 'Day:', day, 'Year:', year, 'Month num:', month);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              // Use UTC to avoid timezone issues that can shift the date by one day
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed emoji date format:', extractedDate);
                break;
              }
            }
          } else if (i === 1) {
            // Handle date ranges like "8 - 14 July 2025" - use the end date
            const startDay = parseInt(match[1]);
            const endDay = parseInt(match[2]);
            const monthName = match[3].toLowerCase();
            year = parseInt(match[4]);
            month = monthMap[monthName];
            
            // Use the end date of the range
            day = endDay;
            
            console.log('Date range pattern - Start:', startDay, 'End:', endDay, 'Month:', monthName, 'Year:', year);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed date range format:', extractedDate);
                break;
              }
            }
          } else if (i === 2) {
            // Handle "19 20 July 2025" format - use the later date
            const firstDay = parseInt(match[1]);
            const secondDay = parseInt(match[2]);
            const monthName = match[3].toLowerCase();
            year = parseInt(match[4]);
            month = monthMap[monthName];
            
            // Use the later date
            day = Math.max(firstDay, secondDay);
            
            console.log('Two days pattern - Day1:', firstDay, 'Day2:', secondDay, 'Using:', day, 'Month:', monthName, 'Year:', year);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed two days format:', extractedDate);
                break;
              }
            }
          } else if (i === 3) {
            // Handle "19 July 2025" format
            day = parseInt(match[1]);
            const monthName = match[2].toLowerCase();
            year = parseInt(match[3]);
            month = monthMap[monthName];
            
            console.log('Single day pattern - Day:', day, 'Month:', monthName, 'Year:', year);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed single day format:', extractedDate);
                break;
              }
            }
          } else if (i === 4) {
            // Handle regular format: "September 7th, 2025"
            const monthName = match[1].toLowerCase();
            day = parseInt(match[2]);
            year = parseInt(match[4]);
            month = monthMap[monthName];
            
            console.log('Regular pattern - Month:', monthName, 'Day:', day, 'Year:', year, 'Month num:', month);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              // Use UTC to avoid timezone issues that can shift the date by one day
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed regular date format:', extractedDate);
                break;
              }
            }
          } else if (i === 5 || i === 6) {
            // Handle full/short month name formats
            const monthName = match[1].toLowerCase();
            day = parseInt(match[2]);
            year = parseInt(match[3]);
            month = monthMap[monthName];
            
            console.log('Month name pattern - Month:', monthName, 'Day:', day, 'Year:', year, 'Month num:', month);
            
            if (month && day && year && year >= new Date().getFullYear()) {
              // Use UTC to avoid timezone issues that can shift the date by one day
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed month name format:', extractedDate);
                break;
              }
            }
          } else if (i === 7) {
            // YYYY-MM-DD format
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
            
            if (year >= new Date().getFullYear() && month <= 12 && day <= 31) {
              // Use UTC to avoid timezone issues that can shift the date by one day
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed YYYY-MM-DD format:', extractedDate);
                break;
              }
            }
          } else if (i === 8) {
            // DD/MM/YYYY format
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
            
            if (year >= new Date().getFullYear() && month <= 12 && day <= 31) {
              // Use UTC to avoid timezone issues that can shift the date by one day
              const date = new Date(Date.UTC(year, month - 1, day));
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed DD/MM/YYYY format:', extractedDate);
                break;
              }
            }
          }
        } catch (e) {
          console.log('Failed to parse date:', match[0], e);
          continue;
        }
      }
      
      if (extractedDate) break;
    }

    // If no date found, set intelligent defaults based on task type
    if (!extractedDate) {
      console.log('No date found in content, setting dynamic default...');
      const isEvent = item.tags.some(tag => 
        /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp|festival/i.test(tag)
      );
      
      const currentDate = new Date();
      
      if (isEvent) {
        // For events, set a date 2 weeks from now
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + 14);
        extractedDate = futureDate.toISOString().split('T')[0];
        console.log('No specific date found for event, setting dynamic future date:', extractedDate);
      } else {
        // For other tasks, set a date 1 week from now
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + 7);
        extractedDate = futureDate.toISOString().split('T')[0];
        console.log('No specific date found, setting dynamic default date:', extractedDate);
      }
    }

    console.log('Final extracted date:', extractedDate);
    console.log('=== END DATE EXTRACTION DEBUG ===');
    return extractedDate;
  }

  // Check if task is event-related
  function isEventTask(taskText: string): boolean {
    return /register|attend|prepare|تسجيل|حضور|تحضير|participate|join/i.test(taskText);
  }

  const handleTaskToggle = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, selected: !task.selected } : task
    ));
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setEditText(task.text);
    }
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      setTasks(tasks.map(task =>
        task.id === editingTask ? { ...task, text: editText } : task
      ));
      setEditingTask(null);
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditText("");
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAddTask = () => {
    const newTask: TaskPreview = {
      id: crypto.randomUUID(),
      text: "New task",
      selected: true,
      priority: 'medium',
      durationMinutes: 25,
    };
    setTasks([...tasks, newTask]);
    handleEditTask(newTask.id);
  };

  const updateTaskProperty = (taskId: string, property: keyof TaskPreview, value: any) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, [property]: value } : task
    ));
  };

  const selectedTasks = tasks.filter(task => task.selected);
  const hasSelection = selectedTasks.length > 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Review Suggested Tasks
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Review and edit tasks before adding them to your main task list
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Information */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Source:</h4>
            <p className="text-sm font-medium">{knowledgeItem.title}</p>
            {knowledgeItem.summary && (
              <p className="text-xs text-muted-foreground mt-1">{knowledgeItem.summary}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {knowledgeItem.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            {/* Debug info */}
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
              <strong>Debug Info:</strong><br/>
              • Item ID: {knowledgeItem.id || 'No ID'}<br/>
              • Original Content Preview: {(knowledgeItem.originalContent || '').substring(0, 100)}...<br/>
              • Generated Task: {tasks[0]?.text || 'None'}<br/>
              • Task Deadline: {tasks[0]?.deadline || 'None'}<br/>
              • Task Priority: {tasks[0]?.priority || 'None'}<br/>
              • Task Duration: {tasks[0]?.durationMinutes || 'None'} minutes
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Suggested Tasks ({tasks.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTask}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 border rounded-lg transition-all ${
                  task.selected 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-muted bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.selected}
                    onCheckedChange={() => handleTaskToggle(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-3">
                    {/* نص المهمة */}
                    {editingTask === task.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{task.text}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Task Properties */}
                    {editingTask !== task.id && task.selected && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {/* Priority */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Priority</Label>
                          <Select
                            value={task.priority}
                            onValueChange={(value: 'high' | 'medium' | 'low') =>
                              updateTaskProperty(task.id, 'priority', value)
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">
                                <Badge className={getPriorityColor('high')}>High</Badge>
                              </SelectItem>
                              <SelectItem value="medium">
                                <Badge className={getPriorityColor('medium')}>Medium</Badge>
                              </SelectItem>
                              <SelectItem value="low">
                                <Badge className={getPriorityColor('low')}>Low</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Duration */}
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duration (minutes)
                          </Label>
                          <Input
                            type="number"
                            value={task.durationMinutes}
                            onChange={(e) =>
                              updateTaskProperty(task.id, 'durationMinutes', parseInt(e.target.value) || 25)
                            }
                            min="5"
                            max="480"
                            className="h-8"
                          />
                        </div>

                        {/* Deadline */}
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline
                          </Label>
                          <Input
                            type="date"
                            value={task.deadline || ''}
                            onChange={(e) =>
                              updateTaskProperty(task.id, 'deadline', e.target.value || undefined)
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          {hasSelection && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary">
                ✓ Selected {selectedTasks.length} of {tasks.length} tasks to add
              </p>
              <div className="flex gap-2 mt-2">
                {['high', 'medium', 'low'].map(priority => {
                  const count = selectedTasks.filter(t => t.priority === priority).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={priority} className={getPriorityColor(priority)}>
                      {priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}: {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedTasks)}
            disabled={!hasSelection || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''} to Dashboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
