"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeTheme = theme === "system" ? systemTheme : theme;
  const isDark = activeTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema"
      className="inline-flex h-9 items-center rounded-full bg-transparent text-foreground transition-opacity hover:opacity-90"
    >
      <span
        className={cn(
          "relative inline-flex h-7 w-14 items-center rounded-full px-1 transition-colors",
          isDark ? "bg-slate-900" : "bg-slate-200"
        )}
      >
        <Sun
          className={cn(
            "absolute left-1.5 h-3.5 w-3.5 transition-colors",
            isDark ? "text-slate-500" : "text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "absolute right-1.5 h-3.5 w-3.5 transition-colors",
            isDark ? "text-sky-300" : "text-slate-400"
          )}
        />
        <span
          className={cn(
            "relative z-10 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            isDark ? "translate-x-7" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
