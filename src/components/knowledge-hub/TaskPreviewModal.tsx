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
import { Calendar, Clock, Edit3, Plus, Trash2, Check, X } from "lucide-react";
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
    console.log('Initial tasks from knowledge item:', knowledgeItem.tasks);
    
    // Convert tasks from Knowledge Item with enhancements
    let initialTasks = knowledgeItem.tasks || [];
    
    // If no tasks exist, generate smart tasks based on content
    if (initialTasks.length === 0) {
      console.log('No existing tasks found, generating smart tasks...');
      initialTasks = generateSmartTasksFromContent(knowledgeItem);
    }
    
    const processedTasks = initialTasks.map((task, index) => ({
      id: task.id || crypto.randomUUID(),
      text: enhanceTaskText(task.text, knowledgeItem),
      selected: true,
      priority: determinePriority(task.text, knowledgeItem),
      durationMinutes: estimateDuration(task.text),
      deadline: extractDeadline(task.text, knowledgeItem),
    }));
    
    console.log('Processed tasks for modal:', processedTasks);
    return processedTasks;
  });

  // Generate smart tasks automatically if none exist
  function generateSmartTasksFromContent(item: KnowledgeItem): Array<{id: string, text: string, completed: boolean}> {
    const content = `${item.title} ${item.summary} ${item.originalContent || ''} ${item.tags.join(' ')}`;
    const smartTasks = [];
    
    const isEvent = item.tags.some(tag => 
      /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp|festival/i.test(tag)
    );
    
    const isAcademic = item.tags.some(tag =>
      /academic|أكاديمي|university|جامعة|course|دورة|study|دراسة/i.test(tag)
    );
    
    if (isEvent) {
      // Single event task - most events need just one main task
      smartTasks.push({
        id: crypto.randomUUID(),
        text: `Attend: ${item.title}`,
        completed: false
      });
    } else if (isAcademic) {
      // Single academic task
      smartTasks.push({
        id: crypto.randomUUID(),
        text: `Complete: ${item.title}`,
        completed: false
      });
    } else {
      // Single general task
      smartTasks.push({
        id: crypto.randomUUID(),
        text: `Review: ${item.title}`,
        completed: false
      });
    }
    
    return smartTasks;
  }

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Enhance task text based on content type
  function enhanceTaskText(originalText: string, item: KnowledgeItem): string {
    const isEvent = item.tags.some(tag => 
      /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp/i.test(tag)
    );
    
    if (isEvent) {
      // Enhance event-related tasks
      if (/register|تسجيل|registration/i.test(originalText)) {
        return `Register for: ${item.title}`;
      }
      if (/attend|حضور|participate|شارك/i.test(originalText)) {
        return `Attend: ${item.title}`;
      }
      if (/prepare|تحضير|ready/i.test(originalText)) {
        return `Prepare for: ${item.title}`;
      }
    }
    
    return originalText;
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
    
    console.log('Extracting deadline from content:', allContent);
    
    // Enhanced date patterns for better extraction
    const datePatterns = [
      // ISO format YYYY-MM-DD
      /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g,
      
      // DD/MM/YYYY or MM/DD/YYYY
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
      
      // Full month names with year
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4}/gi,
      
      // Short month names
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{1,2},?\s*\d{4}/gi,
      
      // Day Month Year format
      /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/gi,
      
      // Ordinal dates like "1st January 2025"
      /\d{1,2}(st|nd|rd|th)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/gi,
      
      // Arabic month names
      /(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{1,2}/g,
      
      // Time-specific patterns
      /on\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /date:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      
      // Event-specific patterns
      /held\s+on\s+([^,\n.]+\d{4})/gi,
      /will\s+be\s+on\s+([^,\n.]+\d{4})/gi,
      /scheduled\s+for\s+([^,\n.]+\d{4})/gi,
      /event\s+date[:\s]+([^,\n.]+\d{4})/gi,
    ];

    let extractedDate: string | undefined;

    for (const pattern of datePatterns) {
      const matches = allContent.match(pattern);
      if (matches && matches.length > 0) {
        console.log('Found date matches:', matches);
        
        for (const match of matches) {
          try {
            // Clean the match from prefixes
            let cleanMatch = match.replace(/^(on|date:|held\s+on|will\s+be\s+on|scheduled\s+for|event\s+date[:\s]+)\s*/i, '').trim();
            console.log('Trying to parse cleaned match:', cleanMatch);
            
            let date: Date;
            
            // Try different parsing strategies
            
            // Strategy 1: Direct parsing
            date = new Date(cleanMatch);
            if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
              extractedDate = date.toISOString().split('T')[0];
              console.log('Successfully parsed with direct parsing:', extractedDate);
              break;
            }
            
            // Strategy 2: DD/MM/YYYY format
            const ddmmyyyy = cleanMatch.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
            if (ddmmyyyy) {
              const [_, day, month, year] = ddmmyyyy;
              date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed with DD/MM/YYYY strategy:', extractedDate);
                break;
              }
            }
            
            // Strategy 3: MM/DD/YYYY format (US style)
            const mmddyyyy = cleanMatch.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
            if (mmddyyyy) {
              const [_, month, day, year] = mmddyyyy;
              date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed with MM/DD/YYYY strategy:', extractedDate);
                break;
              }
            }
            
            // Strategy 4: YYYY-MM-DD format
            const yyyymmdd = cleanMatch.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (yyyymmdd) {
              const [_, year, month, day] = yyyymmdd;
              date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
                extractedDate = date.toISOString().split('T')[0];
                console.log('Successfully parsed with YYYY-MM-DD strategy:', extractedDate);
                break;
              }
            }
            
          } catch (e) {
            console.log('Failed to parse date:', cleanMatch, e);
            continue;
          }
        }
        if (extractedDate) break;
      }
    }

    // If no date found, check if it's an upcoming event and set a default future date
    if (!extractedDate) {
      const isEvent = item.tags.some(tag => 
        /event|حدث|فعالية|مؤتمر|conference|seminar|workshop|bootcamp|festival/i.test(tag)
      );
      
      if (isEvent) {
        // Set a default date 1 week from now for events without specific dates
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        extractedDate = futureDate.toISOString().split('T')[0];
        console.log('No specific date found for event, setting default future date:', extractedDate);
      }
    }

    console.log('Final extracted date:', extractedDate);
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
            <p className="text-sm">{knowledgeItem.title}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {knowledgeItem.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Suggested Tasks ({tasks.length})</h4>
              {console.log('Rendering tasks section, current tasks.length:', tasks.length)}
              {console.log('Current tasks state:', tasks)}
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
                Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
