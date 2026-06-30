/**
 * Maps the bundled course/lesson catalog (lib/data/courses.ts, lib/data/lessons/)
 * to the runtime `Course`/`Lesson` shapes the screens expect, so guest and
 * offline users can read the same local data the server seed is built from.
 */
import type { CourseEntry } from "./courses";
import { COURSES } from "./courses";
import { ALL_LESSONS } from "./lessons/index";
import type { LessonData } from "./lessons/types";
import type { Course, Lesson, Skill } from "@/types";

function toCourse(c: CourseEntry): Course {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    language: c.languageId,
    level: c.level as Course["level"],
    lessonsCount: c.lessonsCount,
    courseType: c.courseType,
  };
}

function toLesson(l: LessonData): Lesson {
  return {
    id: l.id,
    courseId: l.courseId,
    type: l.type,
    title: l.title,
    description: l.description,
    audioUrl: l.audioUrl ?? undefined,
    duration: l.duration != null ? l.duration * 60 : undefined,
    order: l.order,
    artist: l.artist,
    genre: l.genre,
    skills: l.skills as Skill[] | undefined,
    transcript: l.transcript,
    scene: l.scene,
    sceneTitle: l.sceneTitle,
    sceneOrder: l.sceneOrder,
  };
}

const ACTIVE_LESSONS = ALL_LESSONS.filter((l) => l.isActive !== false);

export function bundledCoursesForLanguage(languageId: string): Course[] {
  return COURSES.filter((c) => c.languageId === languageId)
    .sort((a, b) => a.order - b.order)
    .map(toCourse);
}

export function bundledLessonsForCourse(courseId: string): Lesson[] {
  return ACTIVE_LESSONS.filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order)
    .map(toLesson);
}

export function bundledLessonsForLanguage(languageId: string): Lesson[] {
  const courseIds = new Set(
    COURSES.filter((c) => c.languageId === languageId).map((c) => c.id)
  );
  return ACTIVE_LESSONS.filter((l) => courseIds.has(l.courseId))
    .sort((a, b) => a.order - b.order)
    .map(toLesson);
}

export function bundledLesson(id: string): Lesson | undefined {
  const lesson = ACTIVE_LESSONS.find((l) => l.id === id);
  return lesson ? toLesson(lesson) : undefined;
}
