import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch, isNetworkError } from "@/lib/api";
import { useIsOffline } from "@/lib/hooks/use-offline";
import {
  cacheCourses,
  cacheCourseLessons,
  cacheLanguageLessons,
  cacheLesson,
  readCachedCourses,
  readCachedCourseLessons,
  readCachedLanguageLessons,
  readCachedLesson,
} from "@/lib/catalog-cache";
import type { Course, Lesson } from "@/types";

// The server is the single source of truth for the catalog. Online, every hook
// fetches it live from the public `/courses` + `/lessons` endpoints (they send
// no auth token, so guests get the same catalog as signed-in users). The only
// fallback — offline, or a failed request — is the latest server response we
// mirrored to disk (lib/catalog-cache); the static bundle is intentionally not
// consulted, so guest/offline always match what the server last returned. The
// fallback is empty until the catalog has been fetched at least once.
const coursesFallback = async (languageId: string): Promise<Course[]> =>
  (await readCachedCourses(languageId)) ?? [];
const courseLessonsFallback = async (courseId: string): Promise<Lesson[]> =>
  (await readCachedCourseLessons(courseId)) ?? [];
const languageLessonsFallback = async (languageId: string): Promise<Lesson[]> =>
  (await readCachedLanguageLessons(languageId)) ?? [];

/**
 * Mirrors a live server-catalog response into the identity-independent disk
 * cache (lib/catalog-cache) so a later offline session matches the server. This
 * is an *effect*, not a write inside queryFn, on purpose: React Query serves the
 * catalog from its own persisted cache without re-running queryFn, so a queryFn
 * write would silently never fire on the common warm-start path. Runs whenever
 * `data` is present, from network or the query cache alike; gated to online so
 * it never caches an offline fallback back over the live catalog.
 */
function useCatalogMirror<T>(active: boolean, data: T | undefined, write: (d: T) => void) {
  useEffect(() => {
    if (active && data !== undefined) write(data);
    // `write` is a stable module-level fn; `data`'s identity drives re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, data]);
}

export function useCourses(languageId: string) {
  const isOffline = useIsOffline();

  const query = useQuery<Course[]>({
    queryKey: ["courses", languageId],
    queryFn: async () => {
      if (isOffline) return coursesFallback(languageId);
      try {
        return await apiFetch<Course[]>(`/courses?languageId=${encodeURIComponent(languageId)}`);
      } catch (err) {
        if (isNetworkError(err)) return coursesFallback(languageId);
        throw err;
      }
    },
    enabled: !!languageId,
  });

  useCatalogMirror(!isOffline, query.data, (d) => cacheCourses(languageId, d));
  return query;
}

export function useCourseLessons(courseId: string) {
  const isOffline = useIsOffline();

  const query = useQuery<Lesson[]>({
    queryKey: ["lessons", "course", courseId],
    queryFn: async () => {
      if (isOffline) return courseLessonsFallback(courseId);
      try {
        return await apiFetch<Lesson[]>(`/lessons?courseId=${encodeURIComponent(courseId)}`);
      } catch (err) {
        if (isNetworkError(err)) return courseLessonsFallback(courseId);
        throw err;
      }
    },
    enabled: !!courseId,
  });

  useCatalogMirror(!isOffline, query.data, (d) => cacheCourseLessons(courseId, d));
  return query;
}

export function useLanguageLessons(languageId: string) {
  const isOffline = useIsOffline();

  const query = useQuery<Lesson[]>({
    queryKey: ["lessons", "language", languageId],
    queryFn: async () => {
      if (isOffline) return languageLessonsFallback(languageId);
      try {
        return await apiFetch<Lesson[]>(`/lessons?languageId=${encodeURIComponent(languageId)}`);
      } catch (err) {
        if (isNetworkError(err)) return languageLessonsFallback(languageId);
        throw err;
      }
    },
    enabled: !!languageId,
  });

  useCatalogMirror(!isOffline, query.data, (d) => cacheLanguageLessons(languageId, d));
  return query;
}

export function useLesson(id: string) {
  const isOffline = useIsOffline();

  const query = useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: async () => {
      if (isOffline) {
        const lesson = await readCachedLesson(id);
        if (lesson) return lesson;
        throw new Error(`Lesson ${id} not available offline`);
      }
      try {
        return await apiFetch<Lesson>(`/lessons/${encodeURIComponent(id)}`);
      } catch (err) {
        if (isNetworkError(err)) {
          const lesson = await readCachedLesson(id);
          if (lesson) return lesson;
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  useCatalogMirror(!isOffline, query.data, cacheLesson);
  return query;
}
