// D:\applications\tasks\TaskZenith\src\components\layout\AppBackground.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export function AppBackground({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("relative min-h-screen w-full bg-background isolate", className)}>
      <div 
        aria-hidden="true" 
        className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden"
      >
        {/* Soft radial gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] 
                       bg-radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_40%)" 
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
          }}
        />
      </div>
      {children}
    </div>
  );
}