// D:\applications\tasks\TaskZenith\src\app\page.tsx
// -- FINAL, CLEANED CODE --

"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BrainCircuit, BarChart2, Zap } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 90,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-semibold">TaskZenith</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/signin" passHref>
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup" passHref>
              <Button className="hidden sm:inline-flex">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container"
        >
          <section className="py-20 md:py-28 lg:py-32 text-center">
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-secondary">
                Achieve Peak Productivity with AI
              </h1>
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="max-w-xl md:max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-10"
            >
              TaskZenith isn't just a to-do list. It's your intelligent partner for prioritizing, scheduling, and executing goals with unparalleled efficiency.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth/signup" passHref>
                <Button size="lg" className="w-full sm:w-auto">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard" passHref>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Go to Dashboard
                  </Button>
              </Link>
            </motion.div>
          </section>

          <section id="features" className="py-20 md:py-28">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            >
              <motion.div variants={itemVariants} className="p-8 border rounded-xl bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <motion.div variants={iconVariants} className="flex justify-center mb-4">
                  <BrainCircuit className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Intelligent Task Parsing</h3>
                <p className="text-muted-foreground">
                  Simply type what you need to do in natural language. Our AI will understand, categorize, and schedule it for you.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="p-8 border rounded-xl bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <motion.div variants={iconVariants} className="flex justify-center mb-4">
                  <BarChart2 className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Productivity Reports</h3>
                <p className="text-muted-foreground">
                  Get insightful reports on your performance. Understand your peak hours and optimize your workflow.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="p-8 border rounded-xl bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <motion.div variants={iconVariants} className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Automated Prioritization</h3>
                <p className="text-muted-foreground">
                  Let our AI analyze your task list and suggest the most critical items to focus on next.
                </p>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-20 md:py-28 text-center bg-secondary/30 rounded-2xl my-16">
            <motion.div
               variants={itemVariants}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, amount: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Elevate Your Productivity?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of users who are getting more done with less stress. Your free account is just a click away.
              </p>
              <Link href="/auth/signup" passHref>
                <Button size="lg">Claim Your Free Account Now</Button>
              </Link>
            </motion.div>
          </section>
        </motion.div>
      </main>

      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} TaskZenith. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}