import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Course, Lesson } from "@/types";

export function useCourses(languageId: string) {
  return useQuery<Course[]>({
    queryKey: ["courses", languageId],
    queryFn: () => apiFetch<Course[]>(`/courses?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
}

export function useCourseLessons(courseId: string) {
  return useQuery<Lesson[]>({
    queryKey: ["lessons", "course", courseId],
    queryFn: () => apiFetch<Lesson[]>(`/lessons?courseId=${encodeURIComponent(courseId)}`),
    enabled: !!courseId,
  });
}

export function useLanguageLessons(languageId: string) {
  return useQuery<Lesson[]>({
    queryKey: ["lessons", "language", languageId],
    queryFn: () => apiFetch<Lesson[]>(`/lessons?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
}

export function useLesson(id: string) {
  return useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: () => apiFetch<Lesson>(`/lessons/${encodeURIComponent(id)}`),
    enabled: !!id,
  });
}
