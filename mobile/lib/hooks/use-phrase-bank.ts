import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** One item in a composed review session — a sentence in context, or a word. */
export type ReviewSessionItem =
  | { kind: "phrase"; mode: "recall" | "cloze" | "reorder"; id: string; lessonId: string; text: string; translation: string | null }
  | { kind: "word"; id: string; word: string; english: string };

export type ReviewRating = "again" | "hard" | "good" | "easy";

/**
 * The composed review session: due sentences (capped per lesson, modes
 * rotated) interleaved with due words. The composer manufactures the
 * interleaving server-side — this hook just fetches one session.
 */
export function useReviewSession(languageId?: string, count = 12, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<{ items: ReviewSessionItem[]; totalDuePhrases: number }>({
    queryKey: ["phrasebank", "session", languageId ?? null, count],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/phrasebank/session?languageId=${encodeURIComponent(languageId!)}&count=${count}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!languageId && enabled,
    staleTime: 0,
  });
}

/** Bookmark one transcript line into the sentence bank. */
export function useSavePhrase() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { languageId: string; lessonId: string; text: string; translation?: string | null }) => {
      const token = await getToken();
      return apiFetch<{ saved: true }>("/phrasebank", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["phrasebank"] }),
  });
}

/** Auto-bank a completed lesson's lines (fire-and-forget on completion). */
export function useBankLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const token = await getToken();
      return apiFetch<{ banked: number }>("/phrasebank/bank-lesson", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ lessonId }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["phrasebank"] }),
  });
}

/** Record a phrase review outcome; the server advances its SM-2 schedule. */
export function useReviewPhrase() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confidence }: { id: string; confidence: ReviewRating }) => {
      const token = await getToken();
      return apiFetch<{ nextReviewAt: string; xpEarned: number }>(`/phrasebank/${id}/review`, {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ confidence }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["phrasebank", "session"] }),
  });
}

// ── Can-do self-checks ────────────────────────────────────────────────────────

export interface CanDoItem {
  lessonId: string;
  canDo: string;
  canDoFr?: string | null;
  rating: "yes" | "mostly" | "not_yet" | null;
}

/** A course's can-do statements with the user's self-ratings. */
export function useCourseCanDos(courseId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<{ items: CanDoItem[] }>({
    queryKey: ["can-do", "course", courseId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/can-do/course/${courseId}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!courseId && enabled,
  });
}

/** Record an honest self-rating. Never blocks anything. */
export function useRateCanDo() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, rating }: { lessonId: string; rating: "yes" | "mostly" | "not_yet" }) => {
      const token = await getToken();
      return apiFetch<{ saved: true }>(`/can-do/${lessonId}`, {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ rating }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["can-do"] }),
  });
}
