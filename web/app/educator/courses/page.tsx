"use client";

import { LanguageSelector } from "@/components/ui/language-selector";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { LANGUAGES } from "@mobile/lib/data/languages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowUpDown,
    BookOpen,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Filter,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  description: string;
  languageId: string;
  level: string;
  courseType: string | null;
  order: number;
}

interface LessonSummary {
  id: string;
  courseId: string;
  isActive: boolean;
}

interface EducatorMe {
  isAdmin: boolean;
  reviewerLanguages: string[];
  languages: { id: string; name: string }[];
}

// Stub course types available for generation
const STUB_COURSE_TYPES = [
  { type: "first_words",    label: "First Words" },
  { type: "sound_script",   label: "Sounds & Script" },
  { type: "numbers_trade",  label: "Counting & Trade" },
  { type: "communicative",  label: "Speaking Well" },
  { type: "oral_tradition", label: "Oral Tradition" },
  { type: "songs",          label: "Songs & Sing-Along" },
  { type: "everyday_life",  label: "Everyday Life" },
  { type: "contemporary",   label: "Contemporary World" },
] as const;

type SortKey = "order" | "title" | "level" | "total" | "active";
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

// ─── Generate Dropdown ────────────────────────────────────────────────────────

function GenerateDropdown({
  languageId,
  existingCourseTypes,
  hasAnyCourses,
}: Readonly<{
  languageId: string;
  existingCourseTypes: Set<string>;
  hasAnyCourses: boolean;
}>) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "update">("new");
  const [generating, setGenerating] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const missingTypes = STUB_COURSE_TYPES.filter((t) => !existingCourseTypes.has(t.type));
  const hasMissingTypes = missingTypes.length > 0;

  async function generate(courseType?: string) {
    setGenerating(courseType ?? "all");
    setResult(null);
    try {
      const token = await getToken();
      const res = await apiFetch<{ courses: number; lessons: number }>("/educator/generate-stubs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ languageId, courseType }),
      });
      setResult(`Generated ${res.courses} course${res.courses === 1 ? "" : "s"} · ${res.lessons} lessons`);
      void qc.invalidateQueries({ queryKey: ["educator-courses"] });
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setGenerating(null);
      setOpen(false);
    }
  }

  let updateContent: React.ReactNode;
  if (hasAnyCourses === false) {
    updateContent = (
      <p className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-300">
        No courses exist yet. Use New first.
      </p>
    );
  } else if (hasMissingTypes) {
    updateContent = missingTypes.map((t) => (
      <button
        key={t.type}
        onClick={() => generate(t.type)}
        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.05] transition-colors"
      >
        {t.label}
      </button>
    ));
  } else {
    updateContent = (
      <p className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-300">
        All stub course types are already generated.
      </p>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!generating}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/[0.08] text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        {generating ? "Generating…" : "Generate / Update"}
        <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-72 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f1a] shadow-xl overflow-hidden">
          <div className="p-2 border-b border-neutral-100 dark:border-white/[0.06]">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 dark:bg-white/[0.04] p-1">
              <button
                onClick={() => setMode("new")}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === "new"
                    ? "bg-white dark:bg-white/[0.12] text-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white"
                }`}
              >
                New
              </button>
              <button
                onClick={() => setMode("update")}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === "update"
                    ? "bg-white dark:bg-white/[0.12] text-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white"
                }`}
              >
                Update
              </button>
            </div>
          </div>

          {mode === "new" ? (
            <div className="px-3 py-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-3">
                Create the full starter course set for this language.
              </p>
              <button
                onClick={() => generate()}
                disabled={hasAnyCourses}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
              >
                Create starter set
              </button>
              {hasAnyCourses && (
                <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-300">
                  This language already has courses. Use Update to add missing types.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="px-3 py-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-300 uppercase tracking-wide border-b border-neutral-100 dark:border-white/[0.06]">
                Missing stub course types
              </p>
              {updateContent}
            </div>
          )}
        </div>
      )}

      {result && (
        <p className={`absolute right-0 top-full mt-10 text-xs whitespace-nowrap ${result.includes("course") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: Readonly<{
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}>) {
  const active = current === sortKey;
  let icon: React.ReactNode;
  if (active) {
    icon = dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  } else {
    icon = <ArrowUpDown className="h-3 w-3 opacity-40" />;
  }

  return (
    <th className="text-left px-4 py-2.5">
      <button
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
          active ? "text-brand-600 dark:text-brand-400" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
        }`}
      >
        {label}
        {icon}
      </button>
    </th>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EducatorCoursesPage() {
  const { getToken } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [emptyOnly, setEmptyOnly] = useState(false);

  const { data: me } = useQuery<EducatorMe>({
    queryKey: ["educator-me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorMe>("/educator/me", { token: token! });
    },
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["educator-courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>("/educator/courses", { token: token! });
    },
  });

  const { data: lessons = [] } = useQuery<LessonSummary[]>({
    queryKey: ["educator-lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<LessonSummary[]>("/educator/lessons", { token: token! });
    },
  });

  const languages = me?.languages ?? [];
  const effectiveLanguage = selectedLanguage || languages[0]?.id || "";
  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.name, region: "Other" }
  );

  // Lesson counts per course
  const countsByCourse = lessons.reduce<Record<string, { total: number; active: number }>>((acc, l) => {
    if (!acc[l.courseId]) acc[l.courseId] = { total: 0, active: 0 };
    acc[l.courseId].total++;
    if (l.isActive) acc[l.courseId].active++;
    return acc;
  }, {});

  // Course types already generated for this language
  const existingCourseTypes = new Set(
    courses
      .filter((c) => c.languageId === effectiveLanguage && c.courseType)
      .map((c) => c.courseType!)
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = courses
    .filter((c) => !effectiveLanguage || c.languageId === effectiveLanguage)
    .filter((c) => levelFilter === "all" || c.level === levelFilter)
    .filter((c) => !emptyOnly || (countsByCourse[c.id]?.total ?? 0) === 0)
    .sort((a, b) => {
      const sign = sortDir === "asc" ? 1 : -1;
      if (sortKey === "order") return (a.order - b.order) * sign;
      if (sortKey === "title") return a.title.localeCompare(b.title) * sign;
      if (sortKey === "level") return a.level.localeCompare(b.level) * sign;
      if (sortKey === "total") return ((countsByCourse[a.id]?.total ?? 0) - (countsByCourse[b.id]?.total ?? 0)) * sign;
      if (sortKey === "active") return ((countsByCourse[a.id]?.active ?? 0) - (countsByCourse[b.id]?.active ?? 0)) * sign;
      return 0;
    });

  const hasAnyCourses = courses.some((c) => c.languageId === effectiveLanguage);

  if (!me) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Courses</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select a course to view and manage its lessons.
          </p>
        </div>
        {effectiveLanguage && (
          <GenerateDropdown
            languageId={effectiveLanguage}
            existingCourseTypes={existingCourseTypes}
            hasAnyCourses={hasAnyCourses}
          />
        )}
      </div>

      {/* Toolbar: language + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {languages.length > 1 && (
          <LanguageSelector
            value={effectiveLanguage}
            onChange={setSelectedLanguage}
            languages={enrichedLanguages}
            allowCustom={false}
            className="w-48"
          />
        )}

        {/* Level filter */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-white/[0.08] overflow-hidden">
          {(["all", "beginner", "intermediate", "advanced"] as LevelFilter[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                levelFilter === lvl
                  ? "bg-brand-500 text-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.05]"
              }`}
            >
              {lvl === "all" ? "All levels" : lvl}
            </button>
          ))}
        </div>

        {/* Empty-only toggle */}
        <button
          onClick={() => setEmptyOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            emptyOnly
              ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
              : "border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.05]"
          }`}
        >
          <Filter className="h-3 w-3" />
          Empty only
        </button>
      </div>

      {coursesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 && !hasAnyCourses ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No courses yet</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Use the Generate course button to create a starter set.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No courses match the current filters.</p>
          <button onClick={() => { setLevelFilter("all"); setEmptyOnly(false); }} className="mt-2 text-xs text-brand-500 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02]">
                <SortTh label="Course" sortKey="title" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Level" sortKey="level" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Lessons" sortKey="total" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Active" sortKey="active" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((course, i) => {
                const counts = countsByCourse[course.id] ?? { total: 0, active: 0 };
                const shortTitle = course.title.includes(" — ")
                  ? course.title.split(" — ").slice(1).join(" — ")
                  : course.title;
                return (
                  <tr
                    key={course.id}
                    className={`${i < filtered.length - 1 ? "border-b border-neutral-100 dark:border-white/[0.04]" : ""} hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/educator/courses/${course.id}`}
                        className="font-medium text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group"
                      >
                        {shortTitle}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                      </Link>
                      {course.courseType && (
                        <p className="text-xs text-neutral-400 mt-0.5 capitalize">{course.courseType.replace(/_/g, " ")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 capitalize">
                        {course.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 tabular-nums text-xs">
                      {counts.total || <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {counts.total > 0 ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          counts.active > 0
                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400"
                        }`}>
                          {counts.active}/{counts.total}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/educator/courses/${course.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors"
                      >
                        Open <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
