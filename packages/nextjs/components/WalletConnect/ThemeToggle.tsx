"use client";

import { useEffect, useState } from "react";
import { useAppKitTheme } from "@reown/appkit/react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { DARK_THEME, LIGHT_THEME, type ThemeMode, getInitialTheme, setStoredTheme } from "~~/utils/appkit-theme";

export const ThemeToggle = () => {
  const { setThemeMode, setThemeVariables } = useAppKitTheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = getInitialTheme();
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setThemeVariables(mode === "dark" ? DARK_THEME : LIGHT_THEME);
    setStoredTheme(mode);
    setCurrentTheme(mode);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label="Toggle theme"
      title={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
    >
      {currentTheme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
};
