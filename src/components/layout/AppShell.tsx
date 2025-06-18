// D:\applications\tasks\TaskZenith\src\components\layout\AppShell.tsx
// REVERTED to a simpler version. The logic to check for pathname is removed.
// The component is now responsible for its original layout duties.

"use client";

import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavContent } from "./SidebarNavContent";
import { TimelineClock } from "./TimelineClock"; // This will be the new Drawer component
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { getTasksForUser } from "@/lib/actions";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = React.useState(true);
  const { data: session } = useSession();
  
  // This task-fetching logic is important for the whole app, so it stays here.
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const fetchTasks = React.useCallback(async () => {
    if (session?.user?.id) {
      try {
        const userTasks = await getTasksForUser(session.user.id);
        setTasks(userTasks);
      } catch (error) {
        console.error("[AppShell] Error fetching tasks:", error);
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshTasks = fetchTasks;
    }
  }, [fetchTasks]);

  return (
    <SidebarProvider defaultOpen={true} open={open} onOpenChange={setOpen}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarNavContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
          <div className="md:hidden">
             <SidebarTrigger />
          </div>
          <div className="flex-1">
            {/* Placeholder */}
          </div>
          <div className="flex items-center gap-2">
            {/* The TimelineClock now receives the tasks again */}
            <TimelineClock tasks={tasks} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}