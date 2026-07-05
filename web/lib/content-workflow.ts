/**
 * Beeli Studio editorial workflow — shared between the dictionary and lesson
 * editors (and any future entity that adopts the same draft/review/publish
 * flow). Mirrors the server's four-eyes guard in
 * server/src/routes/content-publish.ts so the UI can hide a doomed action
 * instead of letting the user hit a 403.
 */
import { apiFetch } from "@/lib/api";

export type ContentStatus = "draft" | "in_review" | "published" | "archived";

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
};

export const STATUS_PILL_CLASS: Record<ContentStatus, string> = {
  draft:
    "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/[0.08]",
  in_review:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  published:
    "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  archived:
    "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-white/[0.06]",
};

export type WorkflowActor = {
  isAdmin: boolean;
  reviewerRole?: string | null;
  userId?: string | null;
};

/** Mirrors assertCanPublish() server-side (minus the language-scope check, which the
 * client already respects implicitly — it only ever lists entries in scoped languages).
 * `status` is undefined for rows with no editorial workflow (e.g. contribution-sourced
 * dictionary rows), which are never publishable. */
export function canPublishContent(
  status: ContentStatus | undefined,
  createdBy: string | null | undefined,
  actor: WorkflowActor
): boolean {
  if (!status || status === "published") return false;
  if (actor.isAdmin) return true;
  if (actor.reviewerRole === "teacher" && createdBy && createdBy === actor.userId) return false;
  return true;
}

export function canSubmitForReview(status: ContentStatus | undefined): boolean {
  return status === "draft";
}

/** publishable entity types accepted by POST /content/:entityType/:id/publish.
 * Keep in sync with ENTITY_TYPES in server/src/routes/content-publish.ts. */
export type PublishableEntityType =
  | "dictionary_entries"
  | "proverbs"
  | "etymology_entries"
  | "cultural_content"
  | "sentence_templates"
  | "scenarios"
  | "activities"
  | "courses"
  | "lessons"
  | "story_arcs"
  | "content_partners"
  | "quiz_questions";

export async function publishContent(
  entityType: PublishableEntityType,
  id: string,
  token: string | undefined
): Promise<unknown> {
  return apiFetch(`/content/${entityType}/${id}/publish`, { method: "POST", token });
}

export async function schedulePublishContent(
  entityType: PublishableEntityType,
  id: string,
  publishAt: Date,
  token: string | undefined
): Promise<unknown> {
  return apiFetch(`/content/${entityType}/${id}/schedule-publish`, {
    method: "POST",
    body: JSON.stringify({ publishAt: publishAt.toISOString() }),
    token,
  });
}

export async function unschedulePublishContent(
  entityType: PublishableEntityType,
  id: string,
  token: string | undefined
): Promise<unknown> {
  return apiFetch(`/content/${entityType}/${id}/unschedule-publish`, { method: "POST", token });
}

/** "Scheduled" isn't a real status value (the row is still draft/in_review
 * until the cron flips it) — it's `canPublishContent` true, `publishAt` set,
 * and that date still in the future. Compute it wherever a status pill is
 * rendered instead of adding a 5th enum value. */
export function isScheduled(status: ContentStatus | undefined, publishAt: string | Date | null | undefined): boolean {
  if (!status || status === "published" || status === "archived") return false;
  if (!publishAt) return false;
  return new Date(publishAt).getTime() > Date.now();
}

export const SCHEDULED_LABEL = "Scheduled";
export const SCHEDULED_PILL_CLASS =
  "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
