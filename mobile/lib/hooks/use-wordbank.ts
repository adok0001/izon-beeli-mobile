import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useInvalidateDailyChallenges } from "./use-daily-challenge";

export interface WordBankEntry {
  dictionaryEntryId: string;
  confidence: number;
  reviewCount: number;
  nextReviewAt: string | null;
  languageId: string;
}

export function useWordBank() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<string[]>({
    queryKey: ["wordbank"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<string[]>("/wordbank", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useSaveWord() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  return useMutation({
    mutationFn: async (dictionaryEntryId: string) => {
      const token = await getToken();
      return apiFetch("/wordbank", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ dictionaryEntryId }),
      });
    },
    onMutate: async (dictionaryEntryId) => {
      await queryClient.cancelQueries({ queryKey: ["wordbank"] });
      const previous = queryClient.getQueryData<string[]>(["wordbank"]);
      queryClient.setQueryData<string[]>(["wordbank"], (old) =>
        old ? [...old, dictionaryEntryId] : [dictionaryEntryId]
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wordbank"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbank"] });
      invalidateDailyChallenges();
    },
  });
}

export function useWordsDueForReview() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<WordBankEntry[]>({
    queryKey: ["wordbank", "due"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WordBankEntry[]>("/wordbank/due", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useReviewWord() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      dictionaryEntryId,
      confidence,
    }: {
      dictionaryEntryId: string;
      confidence: "easy" | "hard" | "again";
    }) => {
      const token = await getToken();
      return apiFetch<{ nextReviewAt: string; xpEarned: number; leveledUp: boolean; newLevel?: number; totalPoints?: number }>(`/wordbank/${dictionaryEntryId}/review`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confidence }),
      });
    },
    // Don't invalidate during session — the review screen manages its own queue.
    // Invalidation happens when leaving the screen.
  });
}

export function useInvalidateReviewQueue() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["wordbank", "due"] }),
    [queryClient]
  );
}

export function useRemoveWord() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dictionaryEntryId: string) => {
      const token = await getToken();
      return apiFetch(`/wordbank/${dictionaryEntryId}`, {
        method: "DELETE",
        token: token!,
      });
    },
    onMutate: async (dictionaryEntryId) => {
      await queryClient.cancelQueries({ queryKey: ["wordbank"] });
      const previous = queryClient.getQueryData<string[]>(["wordbank"]);
      queryClient.setQueryData<string[]>(["wordbank"], (old) =>
        old?.filter((id) => id !== dictionaryEntryId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wordbank"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbank"] });
      queryClient.invalidateQueries({ queryKey: ["wordbank", "due"] });
    },
  });
}
