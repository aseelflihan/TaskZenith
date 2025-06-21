// D:\applications\tasks\TaskZenith\src\components\landing\TestimonialsSection.tsx
// -- NEW COMPONENT: INFINITE MOVING CARDS --

"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "TaskZenith transformed my workflow. The AI prioritization is a game-changer and saves me hours every week.",
      name: "Sarah L.",
      title: "Project Manager",
    },
    {
      quote:
        "I've tried every to-do app out there. Nothing comes close to the simplicity and power of TaskZenith. The natural language input is pure magic.",
      name: "Michael B.",
      title: "Freelance Developer",
    },
    {
      quote: "The productivity reports are incredibly insightful. I finally understand where my time goes and how to optimize it. Highly recommended!",
      name: "Jessica D.",
      title: "UX Designer",
    },
    {
      quote:
        "As a student, juggling assignments was a nightmare. TaskZenith's timeline view brought order to my chaos. I can't live without it.",
      name: "Chris P.",
      title: "University Student",
    },
    {
        quote:
          "The most intuitive and beautifully designed productivity tool I have ever used. It's a joy to use every single day.",
        name: "Emily R.",
        title: "Startup Founder",
    },
  ];

  return (
    <div className="py-20 md:py-32 bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12">
          Loved by Professionals Worldwide
        </h2>
        <div className="relative flex flex-col items-center justify-center">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>
      </div>
    </div>
  );
}

const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  
  const [start, setStart] = useState(false);
  
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-6 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            className="w-[350px] max-w-full relative rounded-2xl border border-white/10 flex-shrink-0 px-8 py-6 md:w-[450px]"
            style={{
              background:
                "linear-gradient(180deg, var(--neutral-800), var(--neutral-900)",
            }}
            key={item.name}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className=" relative z-20 text-sm leading-[1.6] text-neutral-100 font-normal">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className=" text-sm leading-[1.6] text-white font-bold">
                    {item.name}
                  </span>
                  <span className=" text-sm leading-[1.6] text-neutral-400 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};