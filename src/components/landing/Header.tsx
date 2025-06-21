// D:\applications\tasks\TaskZenith\src/components/landing/Header.tsx

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';


const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Pricing', href: '#pricing' },
];

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

export function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
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
      className="fixed top-0 left-0 right-0 z-50 bg-background/30 backdrop-blur-md border-b border-foreground/10"
    >
      <div className="container mx-auto flex items-center justify-between h-16 sm:h-20 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="hidden sm:inline">TaskZenith</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href.substring(1));
              }}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link href="/auth/signin" passHref>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-foreground/80 hover:bg-foreground/10 hover:text-foreground px-3">Sign In</Button>
          </Link>
          <Link href="/auth/signup" passHref>
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}