/**
 * In-memory hydration for the DB-backed content snapshot (see
 * `lib/content-snapshot.ts`). The bundle getters this replaces
 * (`getDictionaryForLanguage`, `getSentencesForLanguage`, etc.) were
 * synchronous module-level reads, and many call sites read them at render
 * time. This store preserves that synchronous shape: hydrate once (app boot,
 * language switch, or reconnect), then every getter below reads whatever is
 * currently in memory with no await.
 */
import { create } from "zustand";
import {
  cacheCourses,
  cacheLanguageLessons,
  readCachedCourses,
} from "@/lib/catalog-cache";
import {
  fetchAndCacheSnapshot,
  readCachedSnapshot,
  type ContentSnapshot,
  type TranscriptSegmentRow,
} from "@/lib/content-snapshot";
import type { Course, TranscriptSegment } from "@/types";

interface ContentStoreState {
  snapshots: Record<string, ContentSnapshot | undefined>;
  hydrating: Record<string, boolean>;
  hydrate: (languageId: string) => Promise<void>;
}

export const useContentStore = create<ContentStoreState>((set, get) => ({
  snapshots: {},
  hydrating: {},

  hydrate: async (languageId: string) => {
    if (!languageId || get().hydrating[languageId]) return;
    set((s) => ({ hydrating: { ...s.hydrating, [languageId]: true } }));

    try {
      // Serve whatever is cached immediately, then refresh from the network.
      const cached = await readCachedSnapshot(languageId);
      if (cached) {
        set((s) => ({ snapshots: { ...s.snapshots, [languageId]: cached } }));
      }

      const fresh = await fetchAndCacheSnapshot(languageId);
      if (fresh) {
        set((s) => ({ snapshots: { ...s.snapshots, [languageId]: fresh } }));

        // First-launch-while-never-online-yet: catalog-cache (lib/catalog-cache)
        // is normally populated live by useCourses/useCourseLessons, but starts
        // empty. Seed it from the snapshot only if nothing is cached yet, so we
        // never clobber a more current live mirror.
        const hasCatalog = await readCachedCourses(languageId);
        if (!hasCatalog && fresh.courses.length > 0) {
          cacheCourses(languageId, fresh.courses);
          cacheLanguageLessons(languageId, fresh.lessons.lessons);
        }
      }
    } finally {
      set((s) => ({ hydrating: { ...s.hydrating, [languageId]: false } }));
    }
  },
}));

function snapshotFor(languageId: string): ContentSnapshot | undefined {
  return useContentStore.getState().snapshots[languageId];
}

export function getSnapshotDictionary(languageId: string) {
  return snapshotFor(languageId)?.dictionary ?? [];
}

export function getSnapshotSentences(languageId: string) {
  return snapshotFor(languageId)?.sentences ?? [];
}

export function getSnapshotProverbs(languageId: string) {
  return snapshotFor(languageId)?.proverbs ?? [];
}

export function getSnapshotCultural(languageId: string) {
  return snapshotFor(languageId)?.cultural ?? [];
}

/**
 * Published lessons for a language (across all its courses), with transcript
 * segments embedded as `.transcript` — matching the shape `GET /lessons/:id`
 * returns for a single lesson, and what the bundled `LessonData` always
 * carried, so callers that read `lesson.transcript` keep working unchanged.
 */
export function getSnapshotLessons(languageId: string) {
  const bundle = snapshotFor(languageId)?.lessons;
  if (!bundle) return [];

  const segmentsByLesson = new Map<string, TranscriptSegment[]>();
  for (const seg of bundle.segments) {
    const list = segmentsByLesson.get(seg.lessonId) ?? [];
    list.push({
      id: seg.id,
      startTime: seg.startTime,
      endTime: seg.endTime,
      text: seg.text,
      translation: seg.translation,
      translationFr: seg.translationFr,
      speaker: seg.speaker,
      roman: seg.roman,
    });
    segmentsByLesson.set(seg.lessonId, list);
  }

  return bundle.lessons.map((lesson) => ({
    ...lesson,
    transcript: segmentsByLesson.get(lesson.id) ?? [],
  }));
}

/** Script characters for a language, optionally filtered to one script id. */
export function getSnapshotScriptCharacters(languageId: string, scriptId?: string) {
  const bundle = snapshotFor(languageId)?.scripts;
  if (!bundle) return [];
  return scriptId ? bundle.characters.filter((c) => c.scriptId === scriptId) : bundle.characters;
}

export function getSnapshotScripts(languageId: string) {
  return snapshotFor(languageId)?.scripts.scripts ?? [];
}

/**
 * Interactive stories are cross-language (keyed by storyId, shipped in full in
 * every snapshot — see server content-selectors), so look across any snapshot
 * currently hydrated rather than requiring the active language's snapshot.
 */
export function getSnapshotInteractiveStory(id: string | null | undefined) {
  if (!id) return null;
  for (const snapshot of Object.values(useContentStore.getState().snapshots)) {
    const found = snapshot?.interactiveStories.find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}

export function hasSnapshotInteractiveStory(id: string | null | undefined): boolean {
  return getSnapshotInteractiveStory(id) !== null;
}

/**
 * The profile résumé (can-do statements, skills radar) enriches a completed
 * lesson id with its course's level and its skill tags — metadata that isn't
 * itself returned by the progress endpoints. A completed lesson can belong to
 * any enrolled language, not just the active one, so this searches every
 * snapshot currently hydrated rather than requiring a single languageId.
 * Mirrors the bundle's own documented behavior: a lesson whose language
 * snapshot hasn't hydrated yet simply doesn't resolve (no badge/skill count),
 * same as "server-authored lessons" did against the old static bundle.
 */
function findLessonAcrossSnapshots(lessonId: string) {
  for (const snapshot of Object.values(useContentStore.getState().snapshots)) {
    const lesson = snapshot?.lessons.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, snapshot: snapshot! };
  }
  return null;
}

export function getSnapshotLessonSkills(lessonId: string): string[] {
  return findLessonAcrossSnapshots(lessonId)?.lesson.skills ?? [];
}

export function getSnapshotCourseLevel(lessonId: string): Course["level"] | null {
  const match = findLessonAcrossSnapshots(lessonId);
  if (!match) return null;
  const course = match.snapshot.courses.find((c) => c.id === match.lesson.courseId);
  return course?.level ?? null;
}
