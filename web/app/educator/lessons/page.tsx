"use client";

import { apiFetch } from "@/lib/api";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { LANGUAGES } from "@mobile/lib/data/languages";
import Link from "next/link";
import { useState } from "react";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EducatorCoursesPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState("");

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

  const generateStubsMutation = useMutation({
    mutationFn: async (languageId: string) => {
      const token = await getToken();
      return apiFetch<{ courses: number; lessons: number }>("/educator/generate-stubs", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ languageId }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educator-lessons"] });
      void qc.invalidateQueries({ queryKey: ["educator-courses"] });
    },
  });

  const languages = me?.languages ?? [];
  const effectiveLanguage = selectedLanguage || languages[0]?.id || "";
  const enrichedLanguages = languages.map(
    (l) => LANGUAGES.find((lang) => lang.id === l.id) ?? { id: l.id, name: l.name, nativeName: l.name, region: "Other" }
  );

  const filtered = courses
    .filter((c) => !effectiveLanguage || c.languageId === effectiveLanguage)
    .sort((a, b) => a.order - b.order);

  // Lesson counts per course
  const countsByCourse = lessons.reduce<Record<string, { total: number; active: number }>>((acc, l) => {
    if (!acc[l.courseId]) acc[l.courseId] = { total: 0, active: 0 };
    acc[l.courseId].total++;
    if (l.isActive) acc[l.courseId].active++;
    return acc;
  }, {});

  if (!me) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Courses</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select a course to view and manage its lessons.
          </p>
        </div>
      </div>

      {/* Language selector */}
      {languages.length > 1 && (
        <div className="mb-5">
          <LanguageSelector
            value={effectiveLanguage}
            onChange={setSelectedLanguage}
            languages={enrichedLanguages}
            allowCustom={false}
            className="w-52"
          />
        </div>
      )}

      {coursesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No courses yet</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 mb-5">
            Generate a starter set of courses and template lessons.
          </p>
          <button
            onClick={() => effectiveLanguage && generateStubsMutation.mutate(effectiveLanguage)}
            disabled={!effectiveLanguage || generateStubsMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            {generateStubsMutation.isPending ? "Generating…" : "Generate starter courses"}
          </button>
          {generateStubsMutation.isError && (
            <p className="mt-3 text-xs text-red-500">{(generateStubsMutation.error as Error).message}</p>
          )}
          {generateStubsMutation.isSuccess && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              Generated {generateStubsMutation.data.courses} courses · {generateStubsMutation.data.lessons} lessons — all inactive until reviewed.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Course</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Level</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Lessons</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Active</th>
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
                        href={`/educator/lessons/${course.id}`}
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
                      {counts.total}
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
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/educator/lessons/${course.id}`}
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
