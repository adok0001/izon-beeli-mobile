import { useQuery } from "@tanstack/react-query";
import { apiFetch, isNetworkError } from "@/lib/api";
import {
  bundledCoursesForLanguage,
  bundledLessonsForCourse,
  bundledLessonsForLanguage,
  bundledLesson,
} from "@/lib/data/bundle-adapters";
import { useIsOffline } from "@/lib/hooks/use-offline";
import { useGuestStore } from "@/store/guest-store";
import type { Course, Lesson } from "@/types";

export function useCourses(languageId: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();

  return useQuery<Course[]>({
    queryKey: ["courses", languageId],
    queryFn: async () => {
      if (isGuest || isOffline) return bundledCoursesForLanguage(languageId);
      try {
        return await apiFetch<Course[]>(`/courses?languageId=${encodeURIComponent(languageId)}`);
      } catch (err) {
        if (isNetworkError(err)) return bundledCoursesForLanguage(languageId);
        throw err;
      }
    },
    enabled: !!languageId,
  });
}

export function useCourseLessons(courseId: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();

  return useQuery<Lesson[]>({
    queryKey: ["lessons", "course", courseId],
    queryFn: async () => {
      if (isGuest || isOffline) return bundledLessonsForCourse(courseId);
      try {
        return await apiFetch<Lesson[]>(`/lessons?courseId=${encodeURIComponent(courseId)}`);
      } catch (err) {
        if (isNetworkError(err)) return bundledLessonsForCourse(courseId);
        throw err;
      }
    },
    enabled: !!courseId,
  });
}

export function useLanguageLessons(languageId: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();

  return useQuery<Lesson[]>({
    queryKey: ["lessons", "language", languageId],
    queryFn: async () => {
      if (isGuest || isOffline) return bundledLessonsForLanguage(languageId);
      try {
        return await apiFetch<Lesson[]>(`/lessons?languageId=${encodeURIComponent(languageId)}`);
      } catch (err) {
        if (isNetworkError(err)) return bundledLessonsForLanguage(languageId);
        throw err;
      }
    },
    enabled: !!languageId,
  });
}

export function useLesson(id: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();

  return useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: async () => {
      if (isGuest || isOffline) {
        const lesson = bundledLesson(id);
        if (lesson) return lesson;
      }
      if (isOffline) {
        throw new Error(`Lesson ${id} not found in bundle and device is offline`);
      }
      try {
        return await apiFetch<Lesson>(`/lessons/${encodeURIComponent(id)}`);
      } catch (err) {
        if (isNetworkError(err)) {
          const lesson = bundledLesson(id);
          if (lesson) return lesson;
        }
        throw err;
      }
    },
    enabled: !!id,
  });
}
