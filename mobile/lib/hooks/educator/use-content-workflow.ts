/**
 * Beeli Studio editorial workflow — shared between the dictionary and lesson
 * screens. Mirrors the server's four-eyes guard in
 * server/src/routes/content-publish.ts so the UI can hide a doomed action
 * instead of letting the user hit a 403.
 */
import { apiFetch } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/badge";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ContentStatus = "draft" | "in_review" | "published" | "archived";

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
};

export const STATUS_TONE: Record<ContentStatus, BadgeTone> = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
  archived: "info",
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

/** Publishes an entity and invalidates the given query keys on success. */
export function usePublishContent(entityType: PublishableEntityType, invalidateKeys: unknown[][]) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/content/${entityType}/${id}/publish`, { method: "POST", token: token ?? undefined });
    },
    onSuccess: () => {
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}

/** "Scheduled" isn't a real status value (the row is still draft/in_review
 * until the cron flips it) — it's canPublishContent-eligible, publishAt set,
 * and that date still in the future. */
export function isScheduled(status: ContentStatus | undefined, publishAt: string | null | undefined): boolean {
  if (!status || status === "published" || status === "archived") return false;
  if (!publishAt) return false;
  return new Date(publishAt).getTime() > Date.now();
}

export function useSchedulePublishContent(entityType: PublishableEntityType, invalidateKeys: unknown[][]) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, publishAt }: { id: string; publishAt: Date }) => {
      const token = await getToken();
      return apiFetch(`/content/${entityType}/${id}/schedule-publish`, {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ publishAt: publishAt.toISOString() }),
      });
    },
    onSuccess: () => {
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}

export function useUnschedulePublishContent(entityType: PublishableEntityType, invalidateKeys: unknown[][]) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/content/${entityType}/${id}/unschedule-publish`, { method: "POST", token: token ?? undefined });
    },
    onSuccess: () => {
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}
