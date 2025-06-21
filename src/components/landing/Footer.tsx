// D:\applications\tasks\TaskZenith\src/components\landing/Footer.tsx

"use client";

import React from "react";
import Link from "next/link";
import { Zap, Twitter, Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

const footerNav = [
  { name: 'Features', href: '#features' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Pricing', href: '#pricing' },
];

const legalLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
];

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/taskzenith', icon: Twitter },
  { name: 'GitHub', href: 'https://github.com/taskzenith', icon: Github },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/taskzenith', icon: Linkedin },
];

const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }
};

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border/70">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">TaskZenith</span>
            </Link>
            <p className="mt-4 max-w-xs text-foreground/70">
              The intelligent task manager designed to help you reach the peak of your productivity.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-2">
            <div>
              <p className="font-semibold">Product</p>
              <ul className="mt-4 space-y-3">
                {footerNav.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.href.substring(1));
                      }}
                      className="text-foreground/80 hover:text-primary transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="font-semibold">Legal</p>
              <ul className="mt-4 space-y-3">
                {legalLinks.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-foreground/80 hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold">Social</p>
              <ul className="mt-4 space-y-3">
                {socialLinks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/70 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/60">
            © {new Date().getFullYear()} TaskZenith. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((item) => (
               <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-primary transition-colors sm:hidden"
               >
                 <item.icon className="h-5 w-5" />
                 <span className="sr-only">{item.name}</span>
               </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}