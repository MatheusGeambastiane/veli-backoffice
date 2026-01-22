"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/shared/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
    >
      {activeTheme === "dark" ? "Claro" : "Escuro"}
    </Button>
  );
}
