// D:\applications\tasks\TaskZenith\src/components\landing\TestimonialsSection.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from 'next/image';

const testimonials = [
  {
    quote: "TaskZenith has fundamentally changed how I approach my day. The AI task generation is a game-changer. I'm getting more done with less stress.",
    name: "Sarah L.",
    title: "Freelance Designer",
    image: "/avatars/sarah.jpg",
  },
  {
    quote: "The collaboration features are incredibly intuitive. Our team's productivity has skyrocketed since we switched. It's the central hub for all our projects now.",
    name: "Michael B.",
    title: "Project Manager, TechCorp",
    image: "/avatars/michael.jpg",
  },
  {
    quote: "I was skeptical about another task app, but the focus timer and progress reports keep me motivated. It's like having a personal productivity coach.",
    name: "Jessica Y.",
    title: "Software Engineer",
    image: "/avatars/jessica.jpg",
  },
  {
    quote: "Finally, an app that's both powerful and beautiful. The interface is so clean and a joy to use every single day.",
    name: "David C.",
    title: "Startup Founder",
    image: "/avatars/david.jpg",
  },
    {
    quote: "The ability to just dump my thoughts and have the AI organize them into a coherent plan is nothing short of magic. Highly recommended.",
    name: "Emily R.",
    title: "Content Creator",
    image: "/avatars/emily.jpg",
  },
];

const TestimonialCard = ({
  quote,
  name,
  title,
  image,
}: (typeof testimonials)[0]) => {
  return (
    <figure
      className={cn(
        "relative w-80 cursor-pointer overflow-hidden rounded-2xl border p-6",
        "border-border/70 bg-card/50 dark:bg-card/60"
      )}
    >
      <div className="flex flex-row items-center gap-4">
        <Image 
            className="rounded-full" 
            width={48} 
            height={48} 
            alt={name} 
            src={image}
            // You can generate placeholder images from a service like unavatar.io
            // For example: src={`https://unavatar.io/twitter/${name.replace(/\s/g, '')}`}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-foreground">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-foreground/70">{title}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm text-foreground/90">
        "{quote}"
      </blockquote>
    </figure>
  );
};

export function TestimonialsSection() {
  // We duplicate the testimonials to create a seamless looping effect
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-background/80">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Loved by Professionals Worldwide
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            Don't just take our word for it. Here's what our users are saying about TaskZenith.
          </p>
        </motion.div>

        <div className="relative mt-16 overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{
              x: ["-0%", "-100%"],
              transition: {
                ease: "linear",
                duration: 40,
                repeat: Infinity,
              },
            }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </motion.div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background/80 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background/80 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}