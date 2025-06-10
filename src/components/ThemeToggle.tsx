
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark" | "system">("system");

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setThemeState(isDarkMode ? "dark" : "theme-light");
  }, []);

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("theme-light", !isDark);
    try {
      localStorage.setItem("taskzenith-theme", theme);
    } catch (e) {
      // localStorage not available
    }
  }, [theme]);
  
  React.useEffect(() => {
    try {
      const localTheme = localStorage.getItem("taskzenith-theme") as "theme-light" | "dark" | "system" | null;
      if (localTheme) {
        setThemeState(localTheme);
      } else {
         const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
         setThemeState(isSystemDark ? "dark" : "theme-light");
      }
    } catch (e) {
      // localStorage not available or default to system
       const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
       setThemeState(isSystemDark ? "dark" : "theme-light");
    }
  }, []);


  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "dark" ? "theme-light" : "dark"));
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
