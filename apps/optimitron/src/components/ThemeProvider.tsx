"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  applyThemeToRoot,
  DEFAULT_THEME,
  resolveTheme,
  THEME_STORAGE_KEY,
  toggleThemeValue,
  type Theme,
} from "@/lib/theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}>({ theme: DEFAULT_THEME, setTheme: () => {}, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = resolveTheme(stored);
    setThemeState(nextTheme);
    applyThemeToRoot(nextTheme);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyThemeToRoot(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = toggleThemeValue(prev);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeToRoot(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
