"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { KnowledgeItem } from "@/lib/types";

export function AddContentPanel() {
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { addItem, setSelectedItem } = useKnowledgeHubStore();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newItem = await response.json();
        addItem(newItem as KnowledgeItem);
        setSelectedItem(newItem as KnowledgeItem);
        setContent("");
      } else {
        // TODO: Show an error toast
        console.error("Failed to add item");
      }
    } catch (error) {
      console.error("Error submitting item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Add to Knowledge Hub</h2>
      <div>
        <Textarea
          placeholder="Drop a link, a paragraph, or just a thought..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-transparent resize-none"
          rows={5}
          disabled={isProcessing}
        />
      </div>
      <Button onClick={handleSubmit} disabled={isProcessing || !content.trim()} className="mt-4 w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </>
        )}
      </Button>
    </div>
  );
}