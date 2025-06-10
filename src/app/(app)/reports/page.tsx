
"use client";
import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProductivityReportDisplay } from "@/components/reports/ProductivityReportDisplay";
import type { Task } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]); // Will be fetched from DB later

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/reports');
    } else if (status === 'authenticated') {
      // TODO: Fetch tasks from Firestore for session.user.id
      // For now, continue loading from localStorage. This will be replaced.
      try {
        const storedTasks = localStorage.getItem("taskzenith-tasks");
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (e) {
        console.error("Failed to load tasks from localStorage for reports page", e);
      }
    }
  }, [status, router, session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading reports...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-xl mb-4">Please sign in to view your productivity reports.</p>
        <Button onClick={() => signIn(undefined, { callbackUrl: '/reports' })}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Productivity Hub</CardTitle>
          <CardDescription>
            Analyze your task completion patterns and get AI-driven insights to boost your efficiency.
            The report is generated based on your completed tasks.
          </CardDescription>
        </CardHeader>
      </Card>
      <ProductivityReportDisplay tasks={tasks} />
    </div>
  );
}
