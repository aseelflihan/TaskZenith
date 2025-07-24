"use client";

import { KnowledgeItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { addKnowledgeHubTasksAction } from "@/lib/actions/knowledge-hub.actions";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { SmartTaskGenerator } from "./SmartTaskGenerator";

export function AIInsightPanel() {
  const { items, selectedItem, toggleFilterTag, filterTags } = useKnowledgeHubStore();
  const { toast } = useToast();
  const [isAddingTasks, setIsAddingTasks] = useState(false);
  const [showTaskPreview, setShowTaskPreview] = useState(false);

  const allTags = [...new Set(items.flatMap(item => item.tags))].sort();
  
  const isLink = selectedItem?.originalContent && (selectedItem.originalContent.startsWith('http') || selectedItem.originalContent.startsWith('www'));
  const isFile = selectedItem?.source === 'File Upload';

  const handleAddTasks = async () => {
    if (!selectedItem || selectedItem.tasks.length === 0) {
      toast({
        title: "No tasks available",
        description: "No tasks are available to add to the task list.",
        variant: "destructive",
      });
      return;
    }
    setShowTaskPreview(true);
  };

  const handleConfirmTasks = async (selectedTasks: any[]) => {
    if (!selectedItem) return;
    setIsAddingTasks(true);
    try {
      const enhancedItem = {
        ...selectedItem,
        tasks: selectedTasks.map(task => ({
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
          title: "✅ Task Added Successfully!",
          description: `"${result.details.taskText}" is now in your dashboard.`,
          duration: 6000,
          action: (
            <button
              onClick={() => {
                // Use a more reliable way to refresh tasks on the dashboard
                localStorage.setItem('refresh-tasks', 'true');
                window.location.href = '/dashboard';
              }}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          ),
        });
        setShowTaskPreview(false);
      } else {
        toast({
          title: "Error Adding Task",
          description: result.error || "Could not verify task addition. Please check your dashboard manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding tasks:", error);
      toast({
        title: "Unexpected Error",
        description: "An error occurred while adding the task.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTasks(false);
    }
  };

  return (
    <AnimatePresence>
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="p-4 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900/50"
        >
          <Card className="bg-transparent border-0 shadow-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>{selectedItem.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-grow flex flex-col min-h-0">
              <Tabs defaultValue="summary" className="flex flex-col flex-grow min-h-0">
                <TabsList className={`grid w-full ${isLink ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                  {!isLink && <TabsTrigger value="original">Original</TabsTrigger>}
                </TabsList>
                <div className="mt-4 flex-grow overflow-y-auto">
                  <TabsContent value="summary">
                    <p className="text-sm text-muted-foreground">{selectedItem.summary}</p>
                  </TabsContent>
                  <TabsContent value="tasks">
                    <div className="space-y-4">
                      {/* Smart Task Generator */}
                      <SmartTaskGenerator
                        knowledgeItem={selectedItem}
                        onTasksAdded={() => {
                          toast({
                            title: "Tasks added successfully",
                            description: "Tasks have been added to your main task list.",
                          });
                        }}
                      />
                      
                      {/* Current Task List */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-3 text-muted-foreground">
                          Tasks extracted from content:
                        </h4>
                        <ul className="space-y-3">
                          {selectedItem.tasks.map((task) => (
                            <li key={task.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="flex-grow text-sm">{task.text}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {selectedItem.tasks.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No tasks extracted from this content</p>
                            <p className="text-xs mt-1">Use "Generate Smart Tasks" to create custom tasks</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="tags">
                      <div className="flex gap-2 flex-wrap">
                          {allTags.map((tag) => (
                              <Badge
                                  key={tag}
                                  variant={filterTags.includes(tag) ? "default" : "secondary"}
                                  className="cursor-pointer hover:bg-primary/80"
                                  onClick={() => toggleFilterTag(tag)}
                              >
                                  {tag}
                              </Badge>
                          ))}
                      </div>
                  </TabsContent>
                  {!isLink && (
                    <TabsContent value="original">
                      {isFile ? (
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2">File Information</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p><span className="font-medium">Name:</span> {(selectedItem as any).fileName}</p>
                              <p><span className="font-medium">Type:</span> {(selectedItem as any).fileType}</p>
                              <p><span className="font-medium">Size:</span> {((selectedItem as any).fileSize / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Extracted Content</h4>
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded border">
                              {selectedItem.originalContent}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {selectedItem.originalContent}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Task Preview Modal */}
          {selectedItem && (
            <TaskPreviewModal
              isOpen={showTaskPreview}
              onClose={() => setShowTaskPreview(false)}
              knowledgeItem={selectedItem}
              onConfirm={handleConfirmTasks}
              isLoading={isAddingTasks}
            />
          )}
        </motion.div>
      )}
      {!selectedItem && (
        <div className="p-4 h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            <p className="text-muted-foreground">Select an item to see AI insights</p>
        </div>
      )}
    </AnimatePresence>
  );
}