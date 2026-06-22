"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function GlobalThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("theme");
      if (stored) {
        setIsDarkMode(stored === "dark");
        setIsReady(true);
        return;
      }

      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
      return;
    }

    document.documentElement.classList.remove("dark");
    window.localStorage.setItem("theme", "light");
  }, [isDarkMode, isReady]);

  return (
    <button
      type="button"
      onClick={() => setIsDarkMode((prev) => !prev)}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span>{isReady ? (isDarkMode ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
