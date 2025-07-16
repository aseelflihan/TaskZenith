"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { QuickActionsModal } from "./QuickActionsModal";
import { useState } from "react";

export function QuickActionsTrigger() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        Quick Actions
      </Button>
      <QuickActionsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}