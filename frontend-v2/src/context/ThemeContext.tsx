"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const emptySubscribe = () => () => {};

function subscribeSystemDark(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSystemDarkSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return false;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  toggleTheme: () => {},
});

const STORAGE_KEY = "codeskill_theme";

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  [key: string]: unknown;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const systemDark = useSyncExternalStore(subscribeSystemDark, getSystemDarkSnapshot, getSystemDarkServerSnapshot);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        return stored;
      }
    } catch {
      // Storage unavailable
    }
    return defaultTheme;
  });

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemDark ? "dark" : "light";
    }
    return theme as ResolvedTheme;
  }, [theme, systemDark]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable
    }
  }, [theme, resolvedTheme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "system") {
        const currentSystem = getSystemTheme();
        return currentSystem === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
