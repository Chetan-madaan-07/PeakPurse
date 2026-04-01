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
      className="p-1.5 rounded-full bg-transparent hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none flex items-center justify-center"
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