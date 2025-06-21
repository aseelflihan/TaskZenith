// D:\applications\tasks\TaskZenith\src/components/landing/CtaSection.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// Reusing a simplified version of the MagicButton from HeroSection
// to maintain consistency and a high-quality feel.
const MagicButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 300 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const maskImage = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(240px at ${x}px ${y}px, white, transparent)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative w-full sm:w-auto h-14 px-8 font-semibold bg-transparent text-foreground border border-border/80 rounded-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/20",
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary to-primary/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl"
      />
      <span className="relative z-10 flex items-center">{children}</span>
    </motion.button>
  );
};

export function CtaSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-secondary/50 p-12 sm:p-20 border border-border/70">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
          >
            {/* A subtle background grid pattern */}
            <div
              className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-[0.06]"
              style={{
                backgroundSize: '30px 30px',
                backgroundImage: 'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
              }}
            />
          </div>

          <motion.div
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Reach Your Zenith?
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              Stop letting tasks manage you. Start organizing your life and work
              with the power of AI. Join thousands of productive users today.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/signup" passHref>
                <MagicButton>
                  <span>Get Started for Free</span>
                  <MoveRight className="ml-2 h-5 w-5" />
                </MagicButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}