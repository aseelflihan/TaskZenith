// D:\applications\tasks\TaskZenith\src/components/landing/PricingSection.tsx

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // Assuming you have a Switch component from shadcn/ui

const pricingPlans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "For individuals starting out with task management.",
    features: [
      "Up to 10 active projects",
      "Basic task management",
      "AI-powered task suggestions",
      "Community support",
    ],
    isFeatured: false,
    cta: "Start for Free",
  },
  {
    name: "Pro",
    price: { monthly: 8, yearly: 77 }, // Yearly price is ~15% off
    description: "For professionals and small teams who need more power.",
    features: [
      "Everything in Free, plus:",
      "Unlimited projects",
      "Intelligent Focus Timer",
      "Advanced AI analytics",
      "Team collaboration (up to 5 users)",
      "Priority email support",
    ],
    isFeatured: true,
    cta: "Start Pro Trial",
  },
  {
    name: "Business",
    price: { monthly: 15, yearly: 144 }, // Yearly price is ~20% off
    description: "For large teams and companies needing advanced control.",
    features: [
      "Everything in Pro, plus:",
      "Unlimited team members",
      "Dedicated account manager",
      "Advanced security & SSO",
      "Custom integrations",
      "24/7 dedicated support",
    ],
    isFeatured: false,
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  };

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Choose the Plan That's Right for You
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            Simple, transparent pricing. No hidden fees.
          </p>
        </motion.div>

        <div className="mt-10 flex justify-center items-center gap-4">
          <span className={cn("font-medium", !isYearly ? "text-primary" : "text-foreground/60")}>
            Monthly
          </span>
          {/* If you haven't added Switch from shadcn, you can install it:
              npx shadcn-ui@latest add switch */}
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            aria-label="Toggle billing frequency"
          />
          <span className={cn("font-medium", isYearly ? "text-primary" : "text-foreground/60")}>
            Yearly (Save up to 20%)
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              custom={i}
              className={cn(
                "flex flex-col rounded-2xl border p-8 transition-all duration-300",
                plan.isFeatured
                  ? "border-primary/50 bg-card shadow-xl shadow-primary/10"
                  : "border-border/70 bg-card/50"
              )}
            >
              {plan.isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-foreground/70 h-12">{plan.description}</p>
              
              <div className="mt-6">
                <span className="text-4xl font-extrabold">
                  ${isYearly ? plan.price.yearly / 12 : plan.price.monthly}
                </span>
                <span className="text-lg font-medium text-foreground/60">/month</span>
              </div>
              {isYearly && plan.price.monthly > 0 && (
                <p className="text-sm text-foreground/60 mt-1">Billed as ${plan.price.yearly} per year</p>
              )}
              
              <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button size="lg" className="w-full mt-10" variant={plan.isFeatured ? "default" : "outline"}>
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}