"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TagsEditorProps {
    initialTags: string[];
    knowledgeId: string;
}

export default function TagsEditor({ initialTags, knowledgeId }: TagsEditorProps) {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");

  const updateTagsOnServer = async (updatedTags: string[]) => {
    try {
      await fetch(`/api/knowledge/${knowledgeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
      // Optionally revert state or show error toast
    }
  };

  const handleAddTag = () => {
    if (inputValue && !tags.includes(inputValue)) {
      const newTags = [...tags, inputValue];
      setTags(newTags);
      setInputValue("");
      updateTagsOnServer(newTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    updateTagsOnServer(newTags);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="Add a tag..."
        />
        <Button onClick={handleAddTag}>Add</Button>
      </div>
    </div>
  );
}