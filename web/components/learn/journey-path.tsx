"use client";

import { cn } from "@/lib/utils";
import { localizePair } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course, CourseType } from "@/types";
import {
  BookOpen,
  Compass,
  Flame,
  Handshake,
  Hand,
  Home,
  Landmark,
  Leaf,
  Scale,
  Ship,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * The journey path — courses as one ordered spine, mirroring the mobile Learn
 * map (`mobile/lib/journey.ts`) rather than bucketing by CEFR level. The
 * Movements span all three levels, so level buckets chopped the single
 * narrative into three carousels.
 *
 * This is the semantic port: ordering, Movement identity and the reference
 * shelf. It deliberately does not reproduce mobile's serpentine canvas.
 */

/** Mirrors COURSE_GLOSS in `mobile/lib/journey.ts`. */
const COURSE_GLOSS: Partial<Record<CourseType, string>> = {
  first_words: "Community",
  community: "Community",
  sound_script: "Script",
  script: "Script",
  songs: "Songs",
  colors: "Colors",
  grammar: "Grammar",
  everyday_life: "House",
  house: "House",
  communicative: "Kitchen",
  numbers_trade: "Market",
  work: "Market",
  oral_tradition: "Waterside",
  contemporary: "City",
  modern_life: "City",
  mv_arrival: "Arrival",
  mv_household: "House",
  mv_village: "Village",
  mv_growing_up: "Waterside",
  mv_threshold: "Threshold",
  mv_working_year: "Market",
  mv_union: "Union",
  mv_assembly: "Assembly",
  mv_elders_voice: "Oratory",
  mv_keeper: "Keeper",
};

/** Lucide stand-ins for the SF Symbols in mobile's COURSE_ICON. */
const COURSE_ICON: Partial<Record<CourseType, LucideIcon>> = {
  mv_arrival: Hand,
  mv_household: Home,
  mv_village: Users,
  mv_growing_up: Ship,
  mv_threshold: Compass,
  mv_working_year: Leaf,
  mv_union: Handshake,
  mv_assembly: Scale,
  mv_elders_voice: Landmark,
  mv_keeper: Flame,
  first_words: Sparkles,
  community: Users,
  everyday_life: Home,
  house: Home,
  numbers_trade: Leaf,
  oral_tradition: Landmark,
};

/**
 * Reference tracks sit off the numbered path. Mirrors `isReferenceCourse` in
 * `mobile/lib/course-path.ts` — the order threshold is 20, which keeps the
 * 343-row auto-generated "Dictionary A–Z" course (order 23) off the spine.
 */
const REFERENCE_COURSE_TYPES = new Set<string>(["grammar", "sound_script", "script"]);
const REFERENCE_ORDER_THRESHOLD = 20;

export function isReferenceCourse(course: Pick<Course, "courseType" | "order">): boolean {
  if (course.courseType && REFERENCE_COURSE_TYPES.has(course.courseType)) return true;
  return course.order != null && course.order >= REFERENCE_ORDER_THRESHOLD;
}

const byOrder = (a: Course, b: Course) => (a.order ?? 0) - (b.order ?? 0);

function StepRow({ course, unit }: Readonly<{ course: Course; unit: number }>) {
  const { uiLanguage } = useUiLanguageStore();
  const { t } = useTranslation();
  const title = localizePair(course.titleTranslations, course.title, uiLanguage);
  const description = localizePair(course.descriptionTranslations, course.description, uiLanguage);
  const gloss = course.courseType ? COURSE_GLOSS[course.courseType] : undefined;
  const Icon = (course.courseType && COURSE_ICON[course.courseType]) || BookOpen;
  const progress = course.progress ?? 0;

  return (
    <li className="relative pl-14">
      {/* Node marker on the spine */}
      <span
        className={cn(
          "absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
          progress === 100
            ? "border-amber-500 bg-amber-500 text-[#06060e]"
            : "border-neutral-300 dark:border-white/[0.15] bg-white dark:bg-[#0f0f1a] text-neutral-500 dark:text-neutral-400",
        )}
        aria-hidden
      >
        {unit}
      </span>

      <Link
        href={`/course/${course.id}`}
        className="group block rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-4 hover:border-amber-400/50 dark:hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("learn.unitLabel", { defaultValue: "Unit {{n}}", n: unit })}
              </span>
              {gloss && (
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {gloss}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-semibold text-neutral-900 dark:text-white">{title}</p>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
            )}
            {progress > 0 && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function JourneyPath({ courses }: Readonly<{ courses: Course[] }>) {
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  const journey = courses.filter((c) => !isReferenceCourse(c)).sort(byOrder);
  const reference = courses.filter(isReferenceCourse).sort(byOrder);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4">
      {journey.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-4 rounded-full bg-amber-500" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
              {t("learn.journeyHeading", { defaultValue: "The Journey" })}
            </h2>
            <div className="h-px flex-1 bg-neutral-100 dark:bg-white/[0.05]" />
          </div>

          {/* The spine */}
          <div className="relative">
            <div
              className="absolute bottom-4 left-5 top-4 w-px bg-gradient-to-b from-amber-500/40 via-neutral-200 to-transparent dark:via-white/[0.08]"
              aria-hidden
            />
            <ol className="space-y-3">
              {journey.map((course, i) => (
                <StepRow key={course.id} course={course} unit={i + 1} />
              ))}
            </ol>
          </div>
        </section>
      )}

      {reference.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-[3px] w-4 rounded-full bg-neutral-400 dark:bg-neutral-600" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
              {t("learn.referenceHeading", { defaultValue: "Reference shelf" })}
            </h2>
            <div className="h-px flex-1 bg-neutral-100 dark:bg-white/[0.05]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {reference.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-3 hover:border-neutral-300 dark:hover:border-white/[0.14] transition-colors"
              >
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                  {localizePair(course.titleTranslations, course.title, uiLanguage)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {course.lessonsCount
                    ? t("learn.totalLessons", { count: course.lessonsCount })
                    : (course.courseType && COURSE_GLOSS[course.courseType]) || ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
