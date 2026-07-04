/**
 * Lesson-specific cultural notes, keyed by lessonId.
 *
 * Podcast episodes author rich per-episode `culturalNotes`, but `toLessonData()`
 * down-converts them away, so the app's `Lesson` never carries them. This
 * bundled map re-attaches them by lesson id (client-side, no server change) so
 * the inline lesson culture card can surface the note that belongs to THIS
 * lesson instead of a language-wide fallback. Add another language's episodes
 * here as its package lands.
 */
import { resolveCulturalNoteAnchor, type CulturalNote } from "./podcast-types";
import { IZON_PODCAST_EPISODES } from "./izon";

export const CULTURAL_NOTES_BY_LESSON: Record<string, CulturalNote[]> =
  Object.fromEntries(
    IZON_PODCAST_EPISODES.filter(
      (ep) => ep.culturalNotes && ep.culturalNotes.length > 0,
    ).map((ep) => [
      ep.id,
      ep.culturalNotes.map((note) => ({
        ...note,
        afterSegmentIndex: note.afterSeq != null ? resolveCulturalNoteAnchor(ep, note.afterSeq) : undefined,
      })),
    ]),
  );

/** The cultural notes authored for a specific lesson, if any. */
export function getLessonCulturalNotes(
  lessonId: string | null | undefined,
): CulturalNote[] | undefined {
  if (!lessonId) return undefined;
  return CULTURAL_NOTES_BY_LESSON[lessonId];
}
