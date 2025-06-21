// D:\applications\tasks\TaskZenith\src\components\landing\ProductivityFlow.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const flowSteps = [
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: "1. Capture Your Thoughts",
    description: "Simply type or speak your goals. No need for complex forms or structures.",
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "2. AI Organizes Magically",
    description: "TaskZenith analyzes your input and automatically creates actionable tasks and sub-tasks.",
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "3. Focus and Execute",
    description: "Use the built-in intelligent timer to work on your tasks distraction-free and hit your targets.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "4. Achieve & Analyze",
    description: "Track your progress with automated reports and see your productivity soar.",
  },
];

export function ProductivityFlow() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="flow" className="py-20 sm:py-32 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            A Seamless Flow from Idea to Achievement
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            See how TaskZenith transforms your scattered thoughts into structured success in four simple steps.
          </p>
        </motion.div>

        <motion.div
          className="relative mt-20 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="absolute top-8 left-0 right-0 hidden h-px -translate-y-1/2 md:block bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {flowSteps.map((step) => (
            <motion.div
              key={step.title}
              className="relative flex flex-col items-center text-center z-10"
              variants={itemVariants}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-foreground/70">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}