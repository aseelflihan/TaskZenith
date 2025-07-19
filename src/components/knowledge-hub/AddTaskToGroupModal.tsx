"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskGroup } from "@/types/quick-task";
import { ListPlus } from "lucide-react";

interface AddTaskToGroupModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  taskGroups: TaskGroup[];
  onSelectGroup: (groupId: string) => void;
}

export function AddTaskToGroupModal({
  isOpen,
  onOpenChange,
  taskGroups,
  onSelectGroup,
}: AddTaskToGroupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Task Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {taskGroups.map((group) => (
            <Button
              key={group.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelectGroup(group.id)}
            >
              <ListPlus className="mr-2 h-4 w-4" />
              {group.title}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}