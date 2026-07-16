import type { CulturalNote } from "@/types";

/**
 * Groups anchored items (cultural notes, in-lesson checks) by the transcript
 * segment index they render after, so each surfaces right where it's relevant
 * instead of only as one block at the end. Items without an
 * `afterSegmentIndex` group at `fallbackIndex` (the last segment) so they
 * still surface even when unanchored.
 */
export function groupByAnchor<T extends { afterSegmentIndex?: number | null }>(
  items: T[] | undefined,
  fallbackIndex: number
): Record<number, T[]> {
  const groups: Record<number, T[]> = {};
  for (const item of items ?? []) {
    const anchor = item.afterSegmentIndex ?? fallbackIndex;
    (groups[anchor] ??= []).push(item);
  }
  return groups;
}

/** @see groupByAnchor — kept as the named entry point for cultural notes. */
export function groupCulturalNotesByAnchor(
  notes: CulturalNote[] | undefined,
  fallbackIndex: number
): Record<number, CulturalNote[]> {
  return groupByAnchor(notes, fallbackIndex);
}
