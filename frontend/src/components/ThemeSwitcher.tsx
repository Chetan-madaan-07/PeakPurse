"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // We only show the UI after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Empty placeholder space to prevent layout shifting
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300 focus:outline-none"
      aria-label="Toggle Dark Mode"
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5 animate-scale-in" />
      ) : (
        <Moon className="w-5 h-5 animate-scale-in" />
      )}
    </button>
  );
}