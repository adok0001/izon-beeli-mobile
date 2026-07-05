import { apiFetch, apiFetchMultipart } from "@/lib/api";
import type { DialectalVariant, DictionaryCategory } from "@/lib/dictionary";
import type { ContentStatus } from "@/lib/hooks/educator/use-content-workflow";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Single source of truth for dictionary categories. These are stored on the entry
// and drive CATEGORY_LABELS / CATEGORY_ICONS lookup, and must match the server's
// VALID_CATEGORIES — so reuse the canonical list rather than redeclaring it here.
export type EducatorDictionaryCategory = DictionaryCategory;

export interface EducatorDictionaryEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  french?: string | null;
  translations?: LocalizedText | null;
  category: EducatorDictionaryCategory;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  exampleTranslationFr?: string | null;
  exampleTranslations?: LocalizedText | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  semanticDomain?: string | null;
  dialectalVariants?: DialectalVariant[] | null;
  /** Absent on contribution-sourced rows (_source: "contribution") — those use their own approval status. */
  status?: ContentStatus;
  createdBy?: string | null;
  _source?: "contribution";
}

export interface UpsertEducatorDictionaryInput {
  id?: string;
  languageId: string;
  word: string;
  english: string;
  category: EducatorDictionaryCategory;
  french?: string;
  translations?: LocalizedText;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  exampleTranslationFr?: string;
  exampleTranslations?: LocalizedText;
  synonyms?: string[];
  antonyms?: string[];
  semanticDomain?: string;
  dialectalVariants?: DialectalVariant[];
  audioUri?: string;
  imageUri?: string;
}

export function useEducatorDictionary(languageId?: string, category?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorDictionaryEntry[]>({
    queryKey: ["educator", "dictionary", languageId ?? null, category ?? null],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (languageId) params.set("languageId", languageId);
      if (category) params.set("category", category);
      const query = params.toString();
      const path = query ? `/educator/dictionary?${query}` : "/educator/dictionary";
      return apiFetch<EducatorDictionaryEntry[]>(path, { token });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useUpsertEducatorDictionary() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertEducatorDictionaryInput) => {
      const token = await getToken();
      const formData = new FormData();

      formData.append("languageId", input.languageId);
      formData.append("word", input.word);
      formData.append("english", input.english);
      formData.append("category", input.category);
      if (input.french) formData.append("french", input.french);
      if (input.pronunciation) formData.append("pronunciation", input.pronunciation);
      if (input.example) formData.append("example", input.example);
      if (input.exampleTranslation) formData.append("exampleTranslation", input.exampleTranslation);
      if (input.exampleTranslationFr) formData.append("exampleTranslationFr", input.exampleTranslationFr);

      // Send the full gloss maps as JSON so the server can persist every language,
      // not just the en/fr flat projection above. Drop empty values first.
      const cleanMap = (map?: LocalizedText) => {
        if (!map) return undefined;
        const entries = Object.entries(map).filter(([, v]) => v?.trim());
        return entries.length > 0 ? Object.fromEntries(entries) : undefined;
      };
      const translations = cleanMap(input.translations);
      const exampleTranslations = cleanMap(input.exampleTranslations);
      if (translations) formData.append("translations", JSON.stringify(translations));
      if (exampleTranslations) formData.append("exampleTranslations", JSON.stringify(exampleTranslations));

      // Lexical enrichment: arrays/variants go as JSON, semantic domain as plain text.
      // The caller is expected to pass already-trimmed, non-empty values.
      if (input.synonyms?.length) formData.append("synonyms", JSON.stringify(input.synonyms));
      if (input.antonyms?.length) formData.append("antonyms", JSON.stringify(input.antonyms));
      if (input.dialectalVariants?.length) formData.append("dialectalVariants", JSON.stringify(input.dialectalVariants));
      if (input.semanticDomain?.trim()) formData.append("semanticDomain", input.semanticDomain.trim());

      if (input.audioUri) {
        const audioName = input.audioUri.split("/").pop() ?? "audio.m4a";
        formData.append("audio", {
          uri: input.audioUri,
          type: "audio/m4a",
          name: audioName,
        } as never);
      }

      if (input.imageUri) {
        const imageName = input.imageUri.split("/").pop() ?? "image.jpg";
        const ext = imageName.split(".").pop()?.toLowerCase() ?? "jpg";
        let type = "image/jpeg";
        if (ext === "png") type = "image/png";
        if (ext === "webp") type = "image/webp";
        formData.append("image", {
          uri: input.imageUri,
          type,
          name: imageName,
        } as never);
      }

      const path = input.id ? `/educator/dictionary/${input.id}` : "/educator/dictionary";
      const method = input.id ? "PATCH" : "POST";
      return apiFetchMultipart<EducatorDictionaryEntry>(path, formData, { method, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-coverage"] });
    },
  });
}

export function useSubmitEducatorDictionaryForReview() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/educator/dictionary/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "in_review" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
    },
  });
}

export function useDeleteEducatorDictionaryEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/educator/dictionary/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-coverage"] });
    },
  });
}
