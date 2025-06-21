// D:\applications\tasks\TaskZenith\src\app\(dashboard)\layout.tsx
// -- CORRECTED CODE FOR DASHBOARD LAYOUT --

// هذا الملف لم يعد بحاجة إلى "use client"
// لأنه يعرض مكونات من جانب الخادم بشكل أساسي

import { AppShell } from "@/components/layout/AppShell";
import { TimelineProvider } from "@/context/TimelineContext";
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
    <TimelineProvider>
      <AppShell>{children}</AppShell>
    </TimelineProvider>
  );
}