// D:\applications\tasks\TaskZenith\src\app\(dashboard)\layout.tsx
// -- UPDATED WITH SOFTER BACKGROUND --

import { AppShell } from "@/components/layout/AppShell";
import { TimelineProvider } from "@/context/TimelineContext";
import SessionProviderWrapper from "../SessionProviderWrapper";
import type { Metadata } from "next";
import { AppBackground } from "@/components/layout/AppBackground"; // Import the new background

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
    <SessionProviderWrapper>
      <TimelineProvider>
        {/* Apply the new background to the dashboard */}
        <AppBackground>
          <AppShell>{children}</AppShell>
        </AppBackground>
      </TimelineProvider>
    </SessionProviderWrapper>
  );
}