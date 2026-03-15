"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

const LANGUAGES = [
  { id: "izon", name: "Izon" },
  { id: "akan", name: "Akan" },
  { id: "amharic", name: "Amharic" },
  { id: "yoruba", name: "Yoruba" },
  { id: "swahili", name: "Swahili" },
  { id: "hausa", name: "Hausa" },
  { id: "igbo", name: "Igbo" },
  { id: "oromo", name: "Oromo" },
] as const;

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-2 bg-gradient-to-r from-brand-500 to-purple-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
              {course.level}
            </span>
            <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug">
              {course.title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        {course.progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {course.lessonsCount} lessons
          </span>
          <Link
            href={`/lesson/${course.id}`}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Start →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId, setLanguage } = useLanguageStore();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?language=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Learn</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Pick a course and start listening
          </p>
        </div>
      </div>

      {/* Language picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              selectedLanguageId === lang.id
                ? "bg-brand-600 text-white border-brand-600"
                : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
            )}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {/* Courses grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl h-44 animate-pulse"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-medium">No courses yet for this language</p>
          <p className="text-sm mt-1">Check back soon or choose another language.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
