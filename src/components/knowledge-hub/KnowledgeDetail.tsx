"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import TagsEditor from "./TagsEditor";
import ActionableTasks from "./ActionableTasks";

// Placeholder type
import { KnowledgeItem } from "@/lib/types";

export default function KnowledgeDetail({ id }: { id: string }) {
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/knowledge/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        } else {
          setItem(null);
        }
      } catch (error) {
        console.error("Failed to fetch knowledge item:", error);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (isLoading) {
    return <KnowledgeDetailSkeleton />;
  }

  if (!item) {
    return <div>Item not found.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Left Column: AI Analysis */}
      <div>
        <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
        <Tabs defaultValue="key-points">
          <TabsList>
            <TabsTrigger value="key-points">Key Points</TabsTrigger>
            <TabsTrigger value="full-summary">Full Summary</TabsTrigger>
          </TabsList>
          <TabsContent value="key-points">
            <p>{item.tldr}</p>
          </TabsContent>
          <TabsContent value="full-summary">
            <p className="whitespace-pre-wrap">{item.summary}</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column: Action Center */}
      <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold mb-2">Tags</h2>
            <TagsEditor initialTags={item.tags} knowledgeId={item.id} />
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">Actionable Tasks</h2>
            <ActionableTasks initialTasks={item.tasks} knowledgeId={item.id} />
        </div>
      </div>
    </div>
  );
}

function KnowledgeDetailSkeleton() {
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-4 mb-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    )
}