// D:\applications\tasks\TaskZenith\src\components\landing\FeaturesSection.tsx
// -- ADVANCED INTERACTIVE UPDATE --

"use client";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { BrainCircuit, BarChart3, ListTodo, Workflow } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export function FeaturesSection() {
  const features = [
    {
      title: "Intelligent Task Parsing",
      description: "Describe tasks in plain English. Our AI understands, categorizes, and schedules them for you instantly.",
      icon: <BrainCircuit className="w-10 h-10 text-cyan-300" />,
      className: "md:col-span-2",
    },
    {
      title: "Automated Prioritization",
      description: "Let our AI analyze your task list and suggest the most critical items to focus on, maximizing your impact.",
      icon: <ListTodo className="w-10 h-10 text-violet-300" />,
      className: "md:col-span-1",
    },
    {
      title: "Workflow Visualization",
      description: "See your entire day, week, or month at a glance with our interactive timeline. Drag, drop, and reschedule with ease.",
      icon: <Workflow className="w-10 h-10 text-amber-300" />,
      className: "md:col-span-1",
    },
    {
      title: "In-Depth Productivity Reports",
      description: "Visualize your progress with beautiful, insightful reports. Understand your peak hours and optimize your workflow.",
      icon: <BarChart3 className="w-10 h-10 text-emerald-300" />,
      className: "md:col-span-2",
    },
  ];

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className="py-20 md:py-32 bg-black relative">
      <div 
        className="max-w-7xl mx-auto px-4 group"
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        <motion.div
            className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
                background: useMotionTemplate`
                    radial-gradient(
                        400px circle at ${mouseX}px ${mouseY}px,
                        rgba(56, 189, 248, 0.1),
                        transparent 80%
                    )
                `,
            }}
        />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-12">
          An Entirely New Way to Be Productive
        </h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={{
            initial: {},
            animate: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i} 
              className={cn(
                "group/bento relative flex flex-col justify-between space-y-4 rounded-2xl border border-white/10 p-6 bg-neutral-900/50 shadow-xl backdrop-blur-sm", 
                feature.className
              )}
              variants={{
                initial: { opacity: 0, y: 40 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="absolute top-4 right-4 text-white">
                    {feature.icon}
                </div>
                <div className="mt-auto">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-neutral-400 text-sm sm:text-base">{feature.description}</p>
                </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}