
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
import { TimelineClock } from "./TimelineClock";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // وظيفة لتحديث المهام
  const fetchTasks = React.useCallback(async () => {
    if (session?.user?.id) {
      try {
        console.log("[AppShell] Fetching tasks...");
        const userTasks = await getTasksForUser(session.user.id);
        setTasks(userTasks);
        setLastUpdate(Date.now());
        console.log("[AppShell] Tasks updated:", userTasks.length);
      } catch (error) {
        console.error("[AppShell] Error fetching tasks:", error);
      }
    }
  }, [session?.user?.id]);

  // التحديث المبدئي عند تحميل الصفحة
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // إعداد التحديث التلقائي كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 60000); // تحديث كل دقيقة

    return () => clearInterval(interval);
  }, [fetchTasks]);

  // جعل وظيفة التحديث متاحة عالمياً
  React.useEffect(() => {
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
            {/* Placeholder for breadcrumbs or page title */}
          </div>          <div className="flex items-center gap-2">
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
