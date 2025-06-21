// D:\applications\tasks\TaskZenith\src\components\landing\HeroSection.tsx
// -- FINAL VERSION WITH RESPONSIVE DESIGN & INTERACTIVE BAR --

"use client";
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const SplineScene = dynamic(
  () => import('./SplineScene'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black"></div>
  }
);

export function HeroSection() {
  return (
    <section className="relative w-full h-[80vh] sm:h-screen grid place-items-center overflow-hidden bg-black">
      {/* Layer 1: Spline Scene */}
      <div className="absolute inset-0 z-0 opacity-60">
        <SplineScene />
      </div>
      
      {/* Layer 2: UI Content */}
      <div className="relative z-10 flex flex-col items-center text-center text-white px-4">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl leading-tight sm:text-5xl md:text-7xl font-extrabold tracking-tight"
          style={{ textShadow: '0px 4px 20px rgba(0, 255, 255, 0.3)' }}
        >
          Clarity in Complexity.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-md sm:max-w-xl mt-4 sm:mt-6 text-base sm:text-lg text-neutral-300"
        >
          TaskZenith uses AI to untangle your workflow, so you can focus on what truly matters.
        </motion.p>
      </div>

      {/* --- START: INTERACTIVE BAR (RESTORED) --- */}
      <motion.div
        className="absolute bottom-5 right-5 z-20 flex items-center justify-center p-2 h-10 w-36 bg-black/50 backdrop-blur-md rounded-full border border-white/10 overflow-hidden"
        initial="rest"
        whileHover="hover"
        animate="rest"
      >
        {/* State for when text is hidden */}
        <motion.div 
          className="flex items-center"
          variants={{ hover: { y: -40, opacity: 0 }, rest: { y: 0, opacity: 1 } }}
          transition={{ duration: 0.3, ease: 'easeIn' }}
        >
            <Zap className="w-6 h-6 text-cyan-400" />
            <p className="text-sm font-semibold text-neutral-300 ml-2">TaskZenith AI</p>
        </motion.div>

        {/* State for when text is shown */}
        <motion.div 
          className="absolute flex items-center"
          variants={{ hover: { y: 0, opacity: 1 }, rest: { y: 40, opacity: 0 } }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <p className="text-sm text-neutral-300">Intelligent Features</p>
        </motion.div>
      </motion.div>
      {/* --- END: INTERACTIVE BAR --- */}
    </section>
  );
}