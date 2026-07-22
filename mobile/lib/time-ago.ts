import i18n from "./i18n";

/**
 * Relative timestamp for feed/notification/profile rows.
 *
 * Past a week it falls back to an absolute short date, so old items don't read
 * as "94 days ago". Pass `alwaysRelative` to keep counting in days instead —
 * notifications want that, since the list is short-lived by nature.
 */
export function timeAgo(dateStr: string, options?: { alwaysRelative?: boolean }): string {
  const then = new Date(dateStr).getTime();
  const diffMins = Math.floor((Date.now() - then) / 60000);

  if (diffMins < 1) return i18n.t("time.justNow");
  if (diffMins < 60) return i18n.t("time.minutesAgo", { count: diffMins });

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return i18n.t("time.hoursAgo", { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  if (options?.alwaysRelative || diffDays < 7) {
    return i18n.t("time.daysAgo", { count: diffDays });
  }

  return new Date(dateStr).toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
  });
}
