import { apiFetch, apiFetchMultipart } from "@/lib/api";
import type { DialectalVariant, DictionaryCategory, DictionaryEntry } from "@/lib/dictionary";
import type { ContentStatus } from "@/lib/hooks/educator/use-content-workflow";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Alias of the canonical category union in lib/dictionary.ts, which is where the
// list itself lives (and which the server mirrors in lib/dictionary-categories.ts,
// guarded by a test). Reuse it rather than redeclaring the values here.
export type EducatorDictionaryCategory = DictionaryCategory;

export interface EducatorDictionaryEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  translations?: LocalizedText | null;
  category: EducatorDictionaryCategory;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
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
  isActive?: boolean;
  _source?: "contribution";
}

export interface UpsertEducatorDictionaryInput {
  id?: string;
  languageId: string;
  word: string;
  english: string;
  category: EducatorDictionaryCategory;
  translations?: LocalizedText;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
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
      if (input.pronunciation) formData.append("pronunciation", input.pronunciation);
      if (input.example) formData.append("example", input.example);
      if (input.exampleTranslation) formData.append("exampleTranslation", input.exampleTranslation);

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

/** Educator/admin dictionary rows carry nullable fields; the learner-facing
 * DictionaryEntry type (shared with the real word screen) doesn't — bridge the
 * two so a Studio preview can reuse the exact same renderer. */
export function toPreviewEntry(item: EducatorDictionaryEntry): DictionaryEntry {
  return {
    id: item.id,
    word: item.word,
    english: item.english,
    translations: item.translations ?? undefined,
    category: item.category,
    languageId: item.languageId,
    pronunciation: item.pronunciation ?? undefined,
    example: item.example ?? undefined,
    exampleTranslation: item.exampleTranslation ?? undefined,
    exampleTranslations: item.exampleTranslations ?? undefined,
    audioUrl: item.audioUrl ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    synonyms: item.synonyms ?? undefined,
    antonyms: item.antonyms ?? undefined,
    semanticDomain: item.semanticDomain ?? undefined,
    dialectalVariants: item.dialectalVariants ?? undefined,
  };
}

export interface PatchEducatorDictionaryFields {
  word?: string;
  pronunciation?: string;
  example?: string;
  translations?: LocalizedText;
  exampleTranslations?: LocalizedText;
  audioUrl?: string;
  exampleAudioUrl?: string;
}

/**
 * Single-field partial PATCH for the replica editor. The server's PATCH route
 * already applies only the keys it receives, so one field at a time is safe.
 *
 * Deliberately does NOT invalidate the query the editing screen renders from —
 * the caller updates its own copy from the returned row instead. Invalidating
 * mid-edit is what made the first replica editor drop keystrokes: the refetch
 * re-rendered the entry and tore the open input out from under the user.
 */
export function usePatchEducatorDictionaryField() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: PatchEducatorDictionaryFields & { id: string }) => {
      const token = await getToken();
      return apiFetch<EducatorDictionaryEntry>(`/educator/dictionary/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(fields),
      });
    },
    onSuccess: () => {
      // Refresh the list surfaces sitting behind the editor, not the editor itself.
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
    },
  });
}

/** Multipart sibling of {@link usePatchEducatorDictionaryField} for recorded or
 * picked audio files, which can't ride along in a JSON body. */
export function usePatchEducatorDictionaryAudio() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, uri }: { id: string; field: "audio" | "exampleAudio"; uri: string }) => {
      const token = await getToken();
      const formData = new FormData();
      const name = uri.split("/").pop() ?? "audio.m4a";
      formData.append(field, { uri, type: "audio/m4a", name } as never);
      return apiFetchMultipart<EducatorDictionaryEntry>(`/educator/dictionary/${id}`, formData, {
        method: "PATCH",
        token,
      });
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
