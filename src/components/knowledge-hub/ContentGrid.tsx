"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeCardSkeleton, KnowledgeGridSkeleton } from "./KnowledgeCardSkeleton";
import { LazyKnowledgeGrid } from "./LazyKnowledgeCard";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import SearchBarWithFilters from "./SearchBarWithFilters";

export function ContentGrid() {
  const { 
    items, 
    selectedItem, 
    setSelectedItem, 
    fetchItems, 
    filterTags, 
    toggleFilterTag, 
    clearFilters, 
    searchTerm, 
    setSearchTerm,
    isLoading,
    isInitialLoad
  } = useKnowledgeHubStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // DEBUG: Log item selection
  const handleItemSelect = (item: any) => {
    console.log('=== ContentGrid Item Selection DEBUG ===');
    console.log('User clicked on Item ID:', item.id);
    console.log('User clicked on Item Title:', item.title);
    console.log('User clicked on Item Summary:', item.summary?.substring(0, 100));
    console.log('User clicked on Item Tasks:', item.tasks);
    console.log('Full item object:', JSON.stringify(item, null, 2));
    console.log('Setting selected item in store...');
    console.log('=== END DEBUG ===');
    setSelectedItem(item);
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter((item: any) => {
    const matchesSearchTerm =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tldr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags =
      filterTags.length === 0 ||
      filterTags.some((filterTag: string) => item.tags.includes(filterTag));

    return matchesSearchTerm && matchesTags;
  });

  // Show skeleton loading during initial load or when loading and no items
  if (isLoading && (isInitialLoad || items.length === 0)) {
    return (
      <div className="h-full flex flex-col p-4">
        <SearchBarWithFilters
          view={view}
          setView={setView}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <div className="flex-1 mt-4">
          <KnowledgeGridSkeleton count={8} />
        </div>
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
          {filterTags.map((tag: string) => (
            <Badge key={tag} variant="default">
              {tag}
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => toggleFilterTag(tag)}>
                  <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
        </div>
      )}
      
      <div className="flex-1 mt-4">
        {filteredItems.length > 0 ? (
          <LazyKnowledgeGrid
            items={filteredItems}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
            initialLoad={4}
            loadIncrement={4}
          />
        ) : !isLoading && items.length > 0 ? (
          // Show "No items found" only when we have items but none match the filter
          <div className="text-center text-muted-foreground mt-8">
            <p className="text-lg">No items found</p>
            <p className="text-sm mt-2">Try adjusting your search terms or filters</p>
          </div>
        ) : !isLoading && items.length === 0 ? (
          // Show "No data" when there are genuinely no items after loading
          <div className="text-center text-muted-foreground mt-8">
            <p className="text-lg">📚 No knowledge items yet</p>
            <p className="text-sm mt-2">Upload your first document or add content to get started</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}