import type { CulturalNote } from "@/lib/data/podcasts/podcast-types";

/**
 * Groups cultural notes by the transcript segment index they should render
 * after, so a lesson's culture beat surfaces right where it's relevant
 * instead of only as one block at the end. Notes without an
 * `afterSegmentIndex` group at `fallbackIndex` (the last segment) so they
 * still surface even when unanchored.
 */
export function groupCulturalNotesByAnchor(
  notes: CulturalNote[] | undefined,
  fallbackIndex: number
): Record<number, CulturalNote[]> {
  const groups: Record<number, CulturalNote[]> = {};
  for (const note of notes ?? []) {
    const anchor = note.afterSegmentIndex ?? fallbackIndex;
    (groups[anchor] ??= []).push(note);
  }
  return groups;
}
