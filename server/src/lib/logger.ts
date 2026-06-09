/**
 * Thin logging wrapper so request/runtime logs go through one place (and can be
 * swapped for a structured logger later). Startup banners and dev CLI scripts
 * (seed/migrate) intentionally keep raw console output.
 */
export const logger = {
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
