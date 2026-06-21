import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useRef, useState } from "react";

interface QuizResultResponse {
  streak?: number;
  streakIncremented?: boolean;
  streakMilestone?: number | null;
}

export interface QuizResultPayload {
  languageId: string;
  score: number;
  accuracy: number;
  durationMs: number;
  questionCount: number;
}

export type QuizResultStatus = "idle" | "saving" | "saved" | "error";

/**
 * Submits a completed activity's score to `/quiz-results` and exposes the
 * outcome so the results screen can tell the user when the save failed.
 *
 * Previously every game screen fired this POST and swallowed errors with
 * `.catch(() => {})`, so a failed save (offline, expired token) was invisible.
 */
export function useSubmitQuizResult(options?: { onStreakUpdate?: (streak: number, isMilestone: boolean) => void }) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<QuizResultStatus>("idle");
  const lastPayload = useRef<QuizResultPayload | null>(null);
  const onStreakUpdateRef = useRef(options?.onStreakUpdate);
  onStreakUpdateRef.current = options?.onStreakUpdate;

  const submit = useCallback(
    async (payload: QuizResultPayload) => {
      lastPayload.current = payload;
      setStatus("saving");
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in");
        const result = await apiFetch<QuizResultResponse>("/quiz-results", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        setStatus("saved");
        if (result.streakIncremented && result.streak) {
          onStreakUpdateRef.current?.(result.streak, !!result.streakMilestone);
        }
      } catch {
        setStatus("error");
      }
    },
    [getToken]
  );

  const retry = useCallback(() => {
    if (lastPayload.current) void submit(lastPayload.current);
  }, [submit]);

  return { submit, retry, status };
}
