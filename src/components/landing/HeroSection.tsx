"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimate, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MoveRight } from "lucide-react";
import clsx from "clsx";

const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true, amount: 0.5 });
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (inView) {
      animate(
        "span",
        {
          opacity: 1,
        },
        {
          duration: 0.2,
          delay: (i) => i * 0.1,
        }
      );
    }
  }, [inView, animate]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-black opacity-0"
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={clsx("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-black text-5xl md:text-7xl leading-snug tracking-tighter">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};

const MagicButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 300 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const maskImage = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(180px at ${x}px ${y}px, white, transparent)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={clsx(
        "group relative w-full sm:w-auto h-14 px-8 font-medium bg-primary-foreground/5 dark:bg-primary-foreground/10 text-primary-foreground/70 dark:text-primary-foreground/80 border border-primary-foreground/10 dark:border-primary-foreground/20 rounded-xl transition-shadow duration-300",
        isHovered && "shadow-[0_0_20px_var(--shadow-primary)]",
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-xl" />
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-primary-foreground/5 dark:bg-primary-foreground/10 rounded-xl"
      />
      <span className="relative z-10 flex items-center">{children}</span>
    </motion.button>
  );
};

export const AuroraBackground = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <main>
      <div
        className={clsx(
          "relative flex flex-col h-screen items-center justify-center bg-background dark:bg-zinc-900 text-slate-950 transition-bg",
          className
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={clsx(
              `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--primary)_10%,var(--indigo-300)_15%,var(--primary)_20%,var(--violet-300)_25%,var(--primary)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-50 will-change-transform`,
            
            'animate-aurora'
            )}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};


export function HeroSection() {
  const mainContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.6, -0.05, 0.01, 0.99], 
        staggerChildren: 0.2, 
        delayChildren: 0.5 
      } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <AuroraBackground>
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4"
        initial="hidden"
        animate="visible"
        variants={mainContentVariants}
      >
        <TextGenerateEffect
          words="Turn Chaos into Clarity"
          className="text-center"
        />

        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl text-lg text-foreground/60 dark:text-foreground/70"
        >
          TaskZenith is the intelligent task manager that organizes your workflow,
          so you can focus on what truly matters. Designed for individuals and teams
          who aim for the peak of productivity.
        </motion.p>
        
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row items-center gap-6"
        >
          <Link href="/signup" passHref>
            <MagicButton>
              <span>Get Started for Free</span>
              <MoveRight className="ml-2 h-5 w-5" />
            </MagicButton>
          </Link>
          <Link href="#features" passHref>
            <motion.button 
              className="group text-foreground/80 dark:text-foreground/90 transition-colors duration-300 hover:text-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center">
                <span>Learn More</span>
                <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </AuroraBackground>
  );
}