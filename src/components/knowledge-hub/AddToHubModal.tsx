"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

export function AddToHubModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

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
        setIsOpen(false);
        setContent("");
        router.refresh(); // Refresh the page to show the new item
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg border-white/20">
        <DialogHeader>
          <DialogTitle>Add to your Knowledge Hub</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Paste a link, a paragraph, or just a thought..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-transparent"
            disabled={isProcessing}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI at Work...
            </>
          ) : (
            "Add to Hub"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}