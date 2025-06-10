
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
import { TimelineClock } from "./TimelineClock"; // Added import

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = React.useState(true); 

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
          </div>
          <TimelineClock /> {/* Added TimelineClock here */}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
