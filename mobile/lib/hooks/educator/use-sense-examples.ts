import { apiFetch } from "@/lib/api";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A sense's usage examples, for the Studio editor.
 *
 * An example is a pointer into the shared `sentences` corpus, not a copy of the
 * text — so `usage` matters: editing a sentence cited in three places changes all
 * three. The editor warns before the edit rather than after.
 */
export interface SenseExample {
  id: string;
  order: number;
  /** The backfill guessed this example belonged to sense 1 — an educator confirms. */
  needsSenseReview: boolean;
  sentenceId: string;
  text: string;
  translation?: string | null;
  translations?: LocalizedText | null;
  audioUrl?: string | null;
  /**
   * How many places cite this sentence — dictionary examples, drills and lesson
   * lines together. Above 1 the editor warns before an edit, because the corpus
   * shares the text deliberately: one correction reaches every citer.
   */
  usedIn: number;
}

export interface EditableSense {
  id: string;
  order: number;
  gloss: string;
  note?: string | null;
  examples: SenseExample[];
}

export interface SentenceUsage {
  dictionaryExamples: number;
  drills: number;
  lessonLines: number;
  total: number;
}

/**
 * The senses of one entry, with their examples.
 *
 * Returns an empty list for an entry the backfill has not reached — the editor
 * falls back to the whole-word example column in that case, so a Studio user
 * never sees a screen with nowhere to type.
 */
export function useSenseExamples(entryId?: string) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EditableSense[]>({
    queryKey: ["sense-examples", entryId ?? null],
    enabled: !!entryId && !!isSignedIn,
    queryFn: async () => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<EditableSense[]>(
        `/dictionary-senses?entryId=${encodeURIComponent(entryId!)}`,
        { token },
      );
    },
  });
}

export function useAddSenseExample(entryId?: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      senseId: string;
      text: string;
      translation?: string;
      translations?: LocalizedText;
    }) => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<{ id: string; sentenceId: string; usage: SentenceUsage }>(
        `/dictionary-senses/${input.senseId}/examples`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            text: input.text,
            translation: input.translation,
            translations: input.translations,
          }),
        },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sense-examples", entryId] }),
  });
}

export function useUpdateSenseExample(entryId?: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      exampleId: string;
      text?: string;
      translation?: string;
      translations?: LocalizedText;
      needsSenseReview?: boolean;
    }) => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<{ id: string; sentenceId: string; usage: SentenceUsage }>(
        `/dictionary-senses/examples/${input.exampleId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            text: input.text,
            translation: input.translation,
            translations: input.translations,
            needsSenseReview: input.needsSenseReview,
          }),
        },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sense-examples", entryId] }),
  });
}

export function useDeleteSenseExample(entryId?: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    // Only the citation goes; the sentence stays in the corpus, where it may be
    // cited elsewhere and may already carry a recording.
    mutationFn: async (exampleId: string) => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<{ deleted: boolean }>(`/dictionary-senses/examples/${exampleId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sense-examples", entryId] }),
  });
}
