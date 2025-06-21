// D:\applications\tasks\TaskZenith\src\components\landing\Header.tsx
// -- MOBILE RESPONSIVE UPDATE --

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10"
    >
      <div className="container mx-auto flex items-center justify-between h-16 sm:h-20 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-white">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
          <span className="hidden sm:inline">TaskZenith</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/auth/signin" passHref>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white px-3">Sign In</Button>
          </Link>
          <Link href="/auth/signup" passHref>
            <Button size="sm" className="bg-white text-black hover:bg-neutral-200">Sign Up</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}