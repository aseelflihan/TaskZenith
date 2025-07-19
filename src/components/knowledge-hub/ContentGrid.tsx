"use client";

import { useEffect } from "react";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeCardSkeleton } from "./KnowledgeCardSkeleton";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export function ContentGrid() {
  const { items, isLoading, selectedItem, setSelectedItem, fetchItems, filterTags, toggleFilterTag, clearFilterTags } = useKnowledgeHubStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = filterTags.length > 0
    ? items.filter(item => filterTags.every(tag => item.tags.includes(tag)))
    : items;

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KnowledgeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {filterTags.length > 0 && (
        <div className="p-4 border-b flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          {filterTags.map(tag => (
            <Badge key={tag} variant="default">
              {tag}
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => toggleFilterTag(tag)}>
                  <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilterTags}>Clear all</Button>
        </div>
      )}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-grow" style={{ gridAutoRows: '1fr' }}>
        {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
            <KnowledgeCard
              item={item}
              key={item.id}
              isSelected={selectedItem?.id === item.id}
              onSelect={() => setSelectedItem(item)}
            />
          ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground mt-8">
                No items found for the selected tags.
            </div>
        )}
      </div>
    </div>
  );
}