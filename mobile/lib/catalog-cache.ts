/**
 * Persists the last successful server catalog response (courses/lessons) to
 * AsyncStorage so guest and offline sessions can render the *live* catalog the
 * user last saw while signed in — not just the static bundled snapshot in
 * `lib/data/`. Without this, server-only content (educator-added lessons, or
 * anything added since the app's bundle was frozen) disappears entirely for
 * guests because the bundled catalog never contained it.
 *
 * This cache is intentionally identity-independent: unlike the React Query
 * persister (app/_layout.tsx), it is NOT busted when the active identity flips
 * to "guest", which is exactly the transition that otherwise drops the data.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Course, Lesson } from "@/types";

// Bump to invalidate every cached catalog entry after a breaking shape change.
const VERSION = "v1";
const PREFIX = `catalog-cache:${VERSION}:`;

const coursesKey = (languageId: string) => `${PREFIX}courses:${languageId}`;
const langLessonsKey = (languageId: string) => `${PREFIX}lessons:lang:${languageId}`;
const courseLessonsKey = (courseId: string) => `${PREFIX}lessons:course:${courseId}`;
const lessonKey = (id: string) => `${PREFIX}lesson:${id}`;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export const readCachedCourses = (languageId: string) =>
  readJson<Course[]>(coursesKey(languageId));
export const cacheCourses = (languageId: string, courses: Course[]) =>
  writeJson(coursesKey(languageId), courses);

export const readCachedLanguageLessons = (languageId: string) =>
  readJson<Lesson[]>(langLessonsKey(languageId));
export const cacheLanguageLessons = (languageId: string, lessons: Lesson[]) =>
  writeJson(langLessonsKey(languageId), lessons);

export const readCachedCourseLessons = (courseId: string) =>
  readJson<Lesson[]>(courseLessonsKey(courseId));
export const cacheCourseLessons = (courseId: string, lessons: Lesson[]) =>
  writeJson(courseLessonsKey(courseId), lessons);

export const readCachedLesson = (id: string) => readJson<Lesson>(lessonKey(id));
export const cacheLesson = (lesson: Lesson) => writeJson(lessonKey(lesson.id), lesson);
