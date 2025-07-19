"use client";

import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeCardSkeleton } from "./KnowledgeCardSkeleton";
import { useState, useEffect } from "react";
import Link from "next/link";

// Placeholder data and type
import { KnowledgeItem } from "@/lib/types";

export default function KnowledgeGrid({ searchTerm }: { searchTerm: string }) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/knowledge');
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch knowledge items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <KnowledgeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tldr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredItems.map((item) => (
        <Link href={`/knowledge-hub/${item.id}`} key={item.id}>
          <KnowledgeCard item={item} />
        </Link>
      ))}
    </div>
  );
}