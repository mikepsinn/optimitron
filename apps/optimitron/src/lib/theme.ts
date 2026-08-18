export type Theme = "dark" | "light";

export const DEFAULT_THEME: Theme = "light";
export const THEME_STORAGE_KEY = "optimitron-theme";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : DEFAULT_THEME;
}

export function toggleThemeValue(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export function applyThemeToRoot(theme: Theme, root: HTMLElement = document.documentElement) {
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}
