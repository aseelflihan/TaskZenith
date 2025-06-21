// D:\applications\tasks\TaskZenith\src\components\layout\AppShell.tsx
// -- CORRECTED WITH LOADING AND AUTHENTICATION CHECK --

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
import { Loader2 } from "lucide-react"; // Import Loader icon
import { useRouter } from "next/navigation"; // Import useRouter for redirection

// A simple full-screen loading component
function AppLoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Your Workspace...</p>
      </div>
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // --- THIS IS THE KEY CHANGE ---
  // We now get the status from useSession
  const { data: session, status } = useSession();
  const router = useRouter();
  // -----------------------------

  const [open, setOpen] = React.useState(true);
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
    // Only fetch tasks if the user is authenticated
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status, fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'authenticated') {
        fetchTasks();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [status, fetchTasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshTasks = fetchTasks;
    }
  }, [fetchTasks]);

  // --- AUTHENTICATION HANDLING LOGIC ---
  useEffect(() => {
    // If the session is not authenticated after loading, redirect to signin
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // While the session status is loading, show a loading screen.
  // This prevents the app from rendering in a broken state.
  if (status === 'loading') {
    return <AppLoadingScreen />;
  }
  
  // Only render the full AppShell if the user is authenticated.
  if (status === 'authenticated') {
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
  
  // Return null or a fallback if not authenticated (though the useEffect will redirect)
  return null;
}