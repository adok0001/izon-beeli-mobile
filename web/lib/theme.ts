export type AppTheme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE = "web-theme";

export function normalizeTheme(value: string | null | undefined): AppTheme {
  if (value === "light" || value === "dark") {
    return value;
  }

  return "system";
}

export function getStoredTheme(): AppTheme {
  if (globalThis.window === undefined) {
    return "system";
  }

  return normalizeTheme(globalThis.window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function persistTheme(theme: AppTheme) {
  if (globalThis.window === undefined) {
    return;
  }

  globalThis.window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function applyTheme(theme: AppTheme) {
  const resolvedTheme =
    theme === "system"
      ? globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";

  document.documentElement.classList.toggle("dark", resolvedTheme);
}

export const THEME_INIT_SCRIPT = `
  (() => {
    const THEME_STORAGE_KEY = "theme";
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  })();
`;