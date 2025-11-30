/**
 * AppKit Theme Configuration
 */

export type ThemeMode = "light" | "dark";

export const LIGHT_THEME = {
  "--w3m-color-mix": "#0052FF",
  "--w3m-color-mix-strength": 20,
  "--w3m-accent": "#0052FF",
  "--w3m-border-radius-master": "12px",
  "--w3m-font-family": "Inter, system-ui, sans-serif",
};

export const DARK_THEME = {
  "--w3m-color-mix": "#3B82F6",
  "--w3m-color-mix-strength": 15,
  "--w3m-accent": "#3B82F6",
  "--w3m-border-radius-master": "12px",
  "--w3m-font-family": "Inter, system-ui, sans-serif",
};

const THEME_STORAGE_KEY = "susuchain.theme";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getInitialTheme(): ThemeMode {
  return getStoredTheme() || getSystemTheme();
}
