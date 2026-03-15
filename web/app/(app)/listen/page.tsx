"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAudioStore } from "@/store/audio-store";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Course, Lesson } from "@/types";

function LessonRow({ lesson, courseTitle }: { lesson: Lesson; courseTitle: string }) {
  const { load, currentLesson, isPlaying, pause } = useAudioStore();
  const isActive = currentLesson?.id === lesson.id;

  const handlePlay = () => {
    if (isActive && isPlaying) {
      pause();
    } else {
      load(lesson);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer group",
        isActive
          ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/40"
          : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
      )}
      onClick={handlePlay}
    >
      {/* Play button */}
      <button
        className={cn(
          "w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-brand-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-brand-100 group-hover:text-brand-600"
        )}
        aria-label={isActive && isPlaying ? "Pause" : "Play"}
      >
        {isActive && isPlaying ? "⏸" : "▶"}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 dark:text-white truncate">{lesson.title}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{courseTitle}</p>
      </div>

      {/* Duration */}
      {lesson.duration !== undefined && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0">
          {formatDuration(lesson.duration)}
        </span>
      )}

      {/* Completed badge */}
      {lesson.completed && (
        <span className="text-green-500 text-sm shrink-0">✓</span>
      )}
    </div>
  );
}

export default function ListenPage() {
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["courses", selectedLanguageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Course[]>(`/courses?language=${selectedLanguageId}`, { token: token ?? undefined });
    },
  });

  const activeCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : courses[0];

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["lessons", activeCourse?.id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Lesson[]>(`/lessons?courseId=${activeCourse!.id}`, { token: token ?? undefined });
    },
    enabled: !!activeCourse,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Listen</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Audio lessons with interactive transcripts
        </p>
      </div>

      {/* Course tabs */}
      {!coursesLoading && courses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCourse?.id === course.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-neutral-200 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-400"
              )}
            >
              {course.title}
            </button>
          ))}
        </div>
      )}

      {/* Lesson list */}
      {lessonsLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <p className="text-4xl mb-3">🎧</p>
          <p className="font-medium">No lessons in this course yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              courseTitle={activeCourse?.title ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
