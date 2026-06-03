import type { CourseType } from "@/types";

export interface CourseTypeColors {
  headerBg: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  progressBar: string;
  /** Hex string for inline-style contexts (progress tick marks, ActivityIndicator, etc.) */
  tickActive: string;
  label: string;
}

export interface LevelColors {
  badgeBg: string;
  badgeText: string;
}

export const COURSE_TYPE_COLORS: Record<CourseType, CourseTypeColors> = {
  first_words: {
    headerBg: "bg-amber-50 dark:bg-amber-950",
    badgeBg: "bg-amber-100 dark:bg-amber-900",
    badgeBorder: "border-amber-200 dark:border-amber-800",
    badgeText: "text-amber-700 dark:text-amber-300",
    progressBar: "bg-amber-500",
    tickActive: "#f59e0b",
    label: "First Words",
  },
  sound_script: {
    headerBg: "bg-sky-50 dark:bg-sky-950",
    badgeBg: "bg-sky-100 dark:bg-sky-900",
    badgeBorder: "border-sky-200 dark:border-sky-800",
    badgeText: "text-sky-700 dark:text-sky-300",
    progressBar: "bg-sky-500",
    tickActive: "#0ea5e9",
    label: "Sounds & Script",
  },
  everyday_life: {
    headerBg: "bg-teal-50 dark:bg-teal-950",
    badgeBg: "bg-teal-100 dark:bg-teal-900",
    badgeBorder: "border-teal-200 dark:border-teal-800",
    badgeText: "text-teal-700 dark:text-teal-300",
    progressBar: "bg-teal-500",
    tickActive: "#14b8a6",
    label: "Everyday Life",
  },
  numbers_trade: {
    headerBg: "bg-orange-50 dark:bg-orange-950",
    badgeBg: "bg-orange-100 dark:bg-orange-900",
    badgeBorder: "border-orange-200 dark:border-orange-800",
    badgeText: "text-orange-700 dark:text-orange-300",
    progressBar: "bg-orange-500",
    tickActive: "#f97316",
    label: "Numbers & Trade",
  },
  oral_tradition: {
    headerBg: "bg-rose-50 dark:bg-rose-950",
    badgeBg: "bg-rose-100 dark:bg-rose-900",
    badgeBorder: "border-rose-200 dark:border-rose-800",
    badgeText: "text-rose-700 dark:text-rose-300",
    progressBar: "bg-rose-500",
    tickActive: "#f43f5e",
    label: "Oral Tradition",
  },
  communicative: {
    headerBg: "bg-blue-50 dark:bg-blue-950",
    badgeBg: "bg-blue-100 dark:bg-blue-900",
    badgeBorder: "border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-700 dark:text-blue-300",
    progressBar: "bg-blue-500",
    tickActive: "#3b82f6",
    label: "Communicative",
  },
  contemporary: {
    headerBg: "bg-indigo-50 dark:bg-indigo-950",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900",
    badgeBorder: "border-indigo-200 dark:border-indigo-800",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    progressBar: "bg-indigo-500",
    tickActive: "#6366f1",
    label: "Contemporary",
  },
  songs: {
    headerBg: "bg-pink-50 dark:bg-pink-950",
    badgeBg: "bg-pink-100 dark:bg-pink-900",
    badgeBorder: "border-pink-200 dark:border-pink-800",
    badgeText: "text-pink-700 dark:text-pink-300",
    progressBar: "bg-pink-500",
    tickActive: "#ec4899",
    label: "Songs",
  },
  colors: {
    headerBg: "bg-fuchsia-50 dark:bg-fuchsia-950",
    badgeBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    badgeBorder: "border-fuchsia-200 dark:border-fuchsia-800",
    badgeText: "text-fuchsia-700 dark:text-fuchsia-300",
    progressBar: "bg-fuchsia-500",
    tickActive: "#d946ef",
    label: "Colours",
  },
};

const FALLBACK_COURSE_TYPE_COLORS: CourseTypeColors = {
  headerBg: "bg-neutral-50 dark:bg-neutral-800",
  badgeBg: "bg-neutral-100 dark:bg-neutral-700",
  badgeBorder: "border-neutral-300 dark:border-neutral-600",
  badgeText: "text-neutral-700 dark:text-neutral-300",
  progressBar: "bg-neutral-500",
  tickActive: "#737373",
  label: "",
};

export function getCourseTypeColors(courseType?: CourseType | null): CourseTypeColors {
  if (!courseType) return FALLBACK_COURSE_TYPE_COLORS;
  return COURSE_TYPE_COLORS[courseType] ?? FALLBACK_COURSE_TYPE_COLORS;
}

export const LEVEL_COLORS: Record<string, LevelColors> = {
  beginner: {
    badgeBg: "bg-emerald-100 dark:bg-emerald-900",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  intermediate: {
    badgeBg: "bg-amber-100 dark:bg-amber-900",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  advanced: {
    badgeBg: "bg-violet-100 dark:bg-violet-900",
    badgeText: "text-violet-700 dark:text-violet-300",
  },
};

const FALLBACK_LEVEL_COLORS: LevelColors = {
  badgeBg: "bg-blue-100 dark:bg-blue-900",
  badgeText: "text-blue-700 dark:text-blue-300",
};

export function getLevelColors(level?: string | null): LevelColors {
  if (!level) return FALLBACK_LEVEL_COLORS;
  return LEVEL_COLORS[level] ?? FALLBACK_LEVEL_COLORS;
}
