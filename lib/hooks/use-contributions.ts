import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

export interface ContributionInput {
  type: "word" | "phrase";
  languageId: string;
  word: string;
  english: string;
  category: DictionaryCategory;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  audioUri?: string; // local file URI for audio pronunciation
}

export function useSubmitContribution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContributionInput) => {
      const token = await getToken();

      if (input.audioUri) {
        const formData = new FormData();
        formData.append("type", input.type);
        formData.append("languageId", input.languageId);
        formData.append("word", input.word);
        formData.append("english", input.english);
        formData.append("category", input.category);
        if (input.pronunciation) formData.append("pronunciation", input.pronunciation);
        if (input.example) formData.append("example", input.example);
        if (input.exampleTranslation) formData.append("exampleTranslation", input.exampleTranslation);

        formData.append("audio", {
          uri: input.audioUri,
          type: "audio/m4a",
          name: "pronunciation.m4a",
        } as any);

        const res = await fetch(`${API_BASE_URL}/contributions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error ${res.status}: ${text}`);
        }
        return res.json();
      } else {
        return apiFetch("/contributions", {
          method: "POST",
          token: token!,
          body: JSON.stringify({
            type: input.type,
            languageId: input.languageId,
            word: input.word,
            english: input.english,
            category: input.category,
            pronunciation: input.pronunciation,
            example: input.example,
            exampleTranslation: input.exampleTranslation,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["approved-words"] });
    },
  });
}

export function useApprovedWords(languageId: string) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DictionaryEntry[]>({
    queryKey: ["approved-words", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<DictionaryEntry[]>(
        `/contributions/approved?languageId=${languageId}`,
        { token: token! }
      );
    },
    enabled: !!isSignedIn,
  });
}
