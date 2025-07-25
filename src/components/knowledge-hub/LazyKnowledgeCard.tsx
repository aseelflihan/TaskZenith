"use client";

import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { KnowledgeCardSkeleton } from "./KnowledgeCardSkeleton";
import { KnowledgeCard } from "./KnowledgeCard";
import { InlineLoader } from "@/components/ui/loading-spinner";
import { KnowledgeItem } from "@/lib/types";

interface LazyKnowledgeCardProps {
  item: KnowledgeItem;
  isSelected: boolean;
  onSelect: () => void;
  delay?: number;
}

export function LazyKnowledgeCard({ 
  item, 
  isSelected, 
  onSelect, 
  delay = 0 
}: LazyKnowledgeCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: true,
  });

  useEffect(() => {
    if (isIntersecting) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
        // Small delay for appearance animation
        setTimeout(() => setShouldShow(true), 50);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isIntersecting, delay]);

  return (
    <div 
      ref={targetRef} 
      className={`w-full transition-all duration-500 ${
        shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {isLoaded ? (
        <KnowledgeCard
          item={item}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      ) : (
        <KnowledgeCardSkeleton />
      )}
    </div>
  );
}

interface LazyGridProps {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
  onItemSelect: (item: KnowledgeItem) => void;
  initialLoad?: number;
  loadIncrement?: number;
}

export function LazyKnowledgeGrid({ 
  items, 
  selectedItem, 
  onItemSelect,
  initialLoad = 4,
  loadIncrement = 4
}: LazyGridProps) {
  const [loadedCount, setLoadedCount] = useState(initialLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newItemsLoaded, setNewItemsLoaded] = useState(false);
  
  const { targetRef: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    triggerOnce: false,
  });

  useEffect(() => {
    if (isIntersecting && loadedCount < items.length && !isLoadingMore) {
      setIsLoadingMore(true);
      
      setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + loadIncrement, items.length));
        setNewItemsLoaded(true);
        setIsLoadingMore(false);
        
        // Reset animation trigger after a moment
        setTimeout(() => setNewItemsLoaded(false), 100);
      }, 800);
    }
  }, [isIntersecting, loadedCount, items.length, isLoadingMore, loadIncrement]);

  const visibleItems = items.slice(0, loadedCount);
  const remainingItems = items.length - loadedCount;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {visibleItems.map((item, index) => {
          const isNewItem = index >= loadedCount - loadIncrement && newItemsLoaded;
          return (
            <LazyKnowledgeCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={() => onItemSelect(item)}
              delay={isNewItem ? (index % loadIncrement) * 150 : index * 100}
            />
          );
        })}
        
        {/* Loading skeletons for new items */}
        {isLoadingMore && Array.from({ length: Math.min(loadIncrement, remainingItems) }, (_, i) => (
          <div
            key={`loading-${i}`}
            className="opacity-0 animate-[fadeIn_0.6s_ease-in-out_forwards]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <KnowledgeCardSkeleton />
          </div>
        ))}
      </div>

      {/* Intersection observer trigger for loading more */}
      {remainingItems > 0 && !isLoadingMore && (
        <div ref={loadMoreRef} className="h-20">
          <InlineLoader text="Loading more items..." />
        </div>
      )}

      {/* Loading indicator when fetching more */}
      {isLoadingMore && (
        <InlineLoader text="Loading new items..." />
      )}

      {/* End of list indicator */}
      {loadedCount >= items.length && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground animate-fadeIn">
          <p className="text-sm">🎉 You've reached the end!</p>
          <p className="text-xs mt-1">Showing all {items.length} items</p>
        </div>
      )}
    </div>
  );
}
