// D:\applications\tasks\TaskZenith\src/components\landing\FeaturesSection.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Zap, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "AI-Powered Task Creation",
    description:
      "Simply describe your goals in plain language, and TaskZenith's AI will generate structured tasks and sub-tasks for you in seconds.",
  },
  {
    icon: <Timer className="h-8 w-8 text-primary" />,
    title: "Intelligent Focus Timer",
    description:
      "A smart pomodoro timer that adapts to your workflow, suggesting breaks when it detects a drop in productivity.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Seamless Collaboration",
    description:
      "Assign tasks, share files, and communicate with your team in one unified workspace. Real-time updates keep everyone in sync.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "Automated Progress Reports",
    description:
      "Receive daily or weekly summaries of your achievements and upcoming deadlines, curated by our AI to keep you on track.",
  },
];

const featureVariants = {
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

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything You Need, Nothing You Don't
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            TaskZenith is packed with powerful features designed to elevate your
            productivity to its peak.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={cn(
                "p-8 rounded-2xl border border-border/70",
                "bg-card/50 dark:bg-card/60", // Slight background tint
                "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10",
                "transition-all duration-300"
              )}
              variants={featureVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={index}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-foreground/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}