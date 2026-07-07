import { apiFetch, apiFetchMultipart } from "@/lib/api";
import type { DialectalVariant, DictionaryCategory, DictionaryEntry } from "@/lib/dictionary";
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
  publishAt?: string | null;
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

/** Educator/admin dictionary rows carry nullable fields; the learner-facing
 * DictionaryEntry type (shared with the real word screen) doesn't — bridge
 * the two so the Studio replica editor and preview can reuse the exact same
 * renderer as the real word screen. */
export function toPreviewEntry(item: EducatorDictionaryEntry): DictionaryEntry {
  return {
    id: item.id,
    word: item.word,
    english: item.english,
    translations: item.translations ?? undefined,
    french: item.french ?? undefined,
    category: item.category,
    languageId: item.languageId,
    pronunciation: item.pronunciation ?? undefined,
    example: item.example ?? undefined,
    exampleTranslation: item.exampleTranslation ?? undefined,
    exampleTranslations: item.exampleTranslations ?? undefined,
    exampleTranslationFr: item.exampleTranslationFr ?? undefined,
    audioUrl: item.audioUrl ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    synonyms: item.synonyms ?? undefined,
    antonyms: item.antonyms ?? undefined,
    semanticDomain: item.semanticDomain ?? undefined,
    dialectalVariants: item.dialectalVariants ?? undefined,
  };
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

export interface PatchEducatorDictionaryFields {
  word?: string;
  pronunciation?: string;
  example?: string;
  translations?: LocalizedText;
  exampleTranslations?: LocalizedText;
  audioUrl?: string;
  exampleAudioUrl?: string;
  category?: EducatorDictionaryCategory;
  synonyms?: string[];
  antonyms?: string[];
  semanticDomain?: string;
  dialectalVariants?: DialectalVariant[];
}

/** Single-field partial PATCH for the live-replica editor — the server route
 * already whitelists individual keys present in the JSON body (see
 * server/src/routes/educator/dictionary.ts), so this sends only what changed
 * rather than the full-form shape `useUpsertEducatorDictionary` sends. */
export function usePatchEducatorDictionaryField() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: PatchEducatorDictionaryFields & { id: string }) => {
      const token = await getToken();
      return apiFetch<EducatorDictionaryEntry>(`/educator/dictionary/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(fields),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
    },
  });
}

/** Audio replace for the live-replica editor — a single file field, distinct
 * from `useUpsertEducatorDictionary`'s combined create/update multipart body. */
export function usePatchEducatorDictionaryAudio() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, uri }: { id: string; field: "audio" | "exampleAudio"; uri: string }) => {
      const token = await getToken();
      const formData = new FormData();
      const name = uri.split("/").pop() ?? "audio.m4a";
      formData.append(field, { uri, type: "audio/m4a", name } as never);
      return apiFetchMultipart<EducatorDictionaryEntry>(`/educator/dictionary/${id}`, formData, { method: "PATCH", token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
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
