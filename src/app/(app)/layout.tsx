// D:\applications\tasks\TaskZenith\src\app\(app)\layout.tsx
// UPDATED: Wrapped the AppShell with the new TimelineProvider.

import { AppShell } from "@/components/layout/AppShell";
import { TimelineProvider } from "@/context/TimelineContext"; // NEW: Import the provider
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TaskZenith Dashboard",
  description: "Manage your tasks efficiently with TaskZenith.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The provider now wraps the entire app layout
    <TimelineProvider>
      <AppShell>{children}</AppShell>
    </TimelineProvider>
  );
}