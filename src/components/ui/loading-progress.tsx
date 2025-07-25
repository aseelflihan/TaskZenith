"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ShimmerSkeleton } from "@/components/ui/skeleton";

interface LoadingProgressProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
}

export function LoadingProgress({ 
  isLoading, 
  message = "Loading knowledge base...",
  showProgress = true 
}: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until actually done
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100);
    }
  }, [isLoading, progress]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-6">
      <div className="text-center space-y-2">
        <ShimmerSkeleton className="h-6 w-48 mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      
      {showProgress && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}

export function PageLoadingOverlay({ 
  isLoading, 
  message = "Preparing your knowledge hub..." 
}: { 
  isLoading: boolean; 
  message?: string; 
}) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingProgress isLoading={isLoading} message={message} />
    </div>
  );
}
