"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Placeholder data and type
import { KnowledgeItem } from "@/lib/types";

export default function KnowledgeList({ searchTerm }: { searchTerm: string }) {
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
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
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
    <div className="flow-root">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredItems.map((item) => (
          <li key={item.id} className="py-3 sm:py-4">
            <Link href={`/knowledge-hub/${item.id}`} className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                  {item.title}
                </p>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                  {item.tldr}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                    {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}