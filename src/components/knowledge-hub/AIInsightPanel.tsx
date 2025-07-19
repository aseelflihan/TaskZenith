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
import { Loader2 } from "lucide-react";
import { addKnowledgeHubTasksAction } from "@/lib/actions/knowledge-hub.actions";

export function AIInsightPanel() {
  const { items, selectedItem, toggleFilterTag, filterTags } = useKnowledgeHubStore();
  const { toast } = useToast();
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  const allTags = [...new Set(items.flatMap(item => item.tags))].sort();
  
  const isLink = selectedItem?.originalContent && (selectedItem.originalContent.startsWith('http') || selectedItem.originalContent.startsWith('www'));

  const handleAddTasks = async () => {
    if (!selectedItem) return;
    setIsAddingTasks(true);
    try {
      const result = await addKnowledgeHubTasksAction(selectedItem);

      if (result.success) {
        toast({
          title: "Tasks Added",
          description: "The actionable tasks have been added to your main task list.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add tasks.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding tasks:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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
                    <ul className="space-y-2">
                      {selectedItem.tasks.map((task) => (
                        <li key={task.id} className="flex items-center">
                          <span className="flex-grow">{task.text}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-4 w-full" onClick={handleAddTasks} disabled={isAddingTasks}>
                      {isAddingTasks ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Tasks to My List"
                      )}
                    </Button>
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
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {selectedItem.originalContent}
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
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