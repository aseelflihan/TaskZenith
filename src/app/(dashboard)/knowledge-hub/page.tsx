"use client";

import { AddContentPanel } from "@/components/knowledge-hub/AddContentPanel";
import { AIInsightPanel } from "@/components/knowledge-hub/AIInsightPanel";
import { ContentGrid } from "@/components/knowledge-hub/ContentGrid";
import { useKnowledgeHubStore } from "@/components/knowledge-hub/useKnowledgeHubStore";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function KnowledgeHubPage() {
  const { selectedItem, setSelectedItem } = useKnowledgeHubStore();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto">
          <ContentGrid />
        </div>
        <Drawer open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
          <DrawerContent className="h-[80vh]">
            <DrawerTitle className="sr-only">{selectedItem?.title || "Knowledge Item Details"}</DrawerTitle>
            <AIInsightPanel />
          </DrawerContent>
        </Drawer>
        <div className="p-4 border-t">
            <AddContentPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 h-full">
      <div className="lg:col-span-3 xl:col-span-2 border-r">
        <AddContentPanel />
      </div>
      <div className="lg:col-span-4 xl:col-span-5 border-r">
        <ContentGrid />
      </div>
      <div className="lg:col-span-3 xl:col-span-3 min-h-0">
        <AIInsightPanel />
      </div>
    </div>
  );
}