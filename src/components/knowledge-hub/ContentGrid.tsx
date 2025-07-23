"use client";
"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeCardSkeleton } from "./KnowledgeCardSkeleton";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import SearchBarWithFilters from "./SearchBarWithFilters";

export function ContentGrid() {
  const { items, isLoading, selectedItem, setSelectedItem, fetchItems, filterTags, toggleFilterTag, clearFilterTags } = useKnowledgeHubStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'grid' | 'list'>('grid');


  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter(item => {
    const matchesSearchTerm =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tldr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags =
      filterTags.length === 0 ||
      filterTags.some(filterTag => item.tags.includes(filterTag));

    return matchesSearchTerm && matchesTags;
  });

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
    <div className="h-full flex flex-col p-4">
      <SearchBarWithFilters
        view={view}
        setView={setView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      {filterTags.length > 0 && (
        <div className="pb-4 border-b flex items-center gap-2 flex-wrap">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <p className="text-lg">No items found</p>
                <p className="text-sm mt-2">Try adjusting your search terms or filters</p>
            </div>
        )}
      </div>
    </div>
  );
}