// D:\applications\tasks\TaskZenith\src\app\auth\layout.tsx
// -- WRAPPED WITH SESSION PROVIDER --

import Link from "next/link";
import { Zap } from "lucide-react";
import React from "react";
import { AppBackground } from "@/components/layout/AppBackground";
import SessionProviderWrapper from "../SessionProviderWrapper"; // 1. Import the wrapper

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. Wrap everything with SessionProviderWrapper
    <SessionProviderWrapper>
      <AppBackground>
          <header className="absolute top-0 left-0 right-0 py-6 px-4 sm:px-8">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-foreground">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span>TaskZenith</span>
              </Link>
          </header>
          
          <main className="flex items-center justify-center min-h-screen py-20">
              {children}
          </main>

          <footer className="absolute bottom-0 left-0 right-0 py-4 px-4 text-center text-xs text-foreground/60">
              <p>© {new Date().getFullYear()} TaskZenith. All rights reserved.</p>
          </footer>
      </AppBackground>
    </SessionProviderWrapper>
  );
}