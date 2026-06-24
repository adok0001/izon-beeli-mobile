import { apiFetch, ApiError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import type { DialectalVariant, DictionaryCategory } from "@/lib/dictionary";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EducatorStats {
  dictionaryEntries: number;
  pendingContributions: number;
  approvedContributions: number;
  pendingLessons: number;
}

export interface AdminStats {
  users: number;
  lessons: number;
  courses: number;
  contributions: number;
  pendingContributions: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  dictionaryEntries: number;
  feedbackReceived: number;
}

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

export interface EducatorCourse {
  id: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  languageId: string;
  level: string;
  order: number;
  courseType?: string | null;
  isActive?: boolean;
}

export interface UpdateEducatorCourseInput {
  id: string;
  title?: string;
  titleFr?: string | null;
  description?: string;
  descriptionFr?: string | null;
  level?: string;
  order?: number;
}

export interface EducatorLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  description: string;
  type: string;
  audioUrl?: string | null;
  duration?: number | null;
  order: number;
  artist?: string | null;
  genre?: string | null;
  isActive?: boolean;
}

export interface EducatorLessonSegment {
  text: string;
  translation?: string | null;
  startTime?: number;
  endTime?: number;
  order: number;
}

export interface EducatorLessonDetail extends EducatorLesson {
  segments: EducatorLessonSegment[];
}

export interface CreateEducatorLessonInput {
  languageId: string;
  courseId?: string;
  title: string;
  description: string;
  type?: string;
  artist?: string;
  genre?: string;
  duration?: number;
  order?: number;
  audioUri?: string;
  segments: EducatorLessonSegment[];
}

export type EducatorStubCourseType =
  | "first-words"
  | "sound-script"
  | "numbers-trade"
  | "daily-life"
  | "verbs-grammar"
  | "culture-proverbs"
  | "songs-stories"
  | "market-travel"
  | "community-ceremony"
  | "children-home"
  | "pro-level"
  | "special-topic";

export function useEducatorStats(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorStats>({
    queryKey: ["educator", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStats>("/educator/stats", { token });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 60 * 1000,
  });
}

export function useAdminStats(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminStats>("/admin/stats", { token });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 60 * 1000,
  });
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
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          message = (JSON.parse(text) as { error?: string }).error ?? text;
        } catch {
          // non-JSON body — fall back to the raw text
        }
        throw new ApiError(res.status, message);
      }

      return res.json() as Promise<EducatorDictionaryEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-coverage"] });
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

export function useEducatorCourses(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorCourse[]>({
    queryKey: ["educator", "courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorCourse[]>("/educator/courses", { token });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useEducatorLessons(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorLesson[]>({
    queryKey: ["educator", "lessons"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorLesson[]>("/educator/lessons", { token });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useEducatorLessonDetail(lessonId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorLessonDetail>({
    queryKey: ["educator", "lesson", lessonId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorLessonDetail>(`/educator/lessons/${lessonId}`, { token });
    },
    enabled: !!isSignedIn && !!lessonId && enabled,
  });
}

export function useCreateEducatorLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEducatorLessonInput) => {
      const token = await getToken();
      const formData = new FormData();

      formData.append("languageId", input.languageId);
      formData.append("title", input.title);
      formData.append("description", input.description);
      if (input.courseId) formData.append("courseId", input.courseId);
      if (input.type) formData.append("type", input.type);
      if (input.artist) formData.append("artist", input.artist);
      if (input.genre) formData.append("genre", input.genre);
      if (input.duration != null) formData.append("duration", String(input.duration));
      if (input.order != null) formData.append("order", String(input.order));
      formData.append("segments", JSON.stringify(input.segments));

      if (input.audioUri) {
        const fileName = input.audioUri.split("/").pop() ?? "lesson.m4a";
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "m4a";
        let mimeType = "audio/m4a";
        if (ext === "mp3") mimeType = "audio/mpeg";
        if (ext === "wav") mimeType = "audio/wav";
        formData.append("audio", {
          uri: input.audioUri,
          type: mimeType,
          name: fileName,
        } as never);
      }

      const res = await fetch(`${API_BASE_URL}/educator/lessons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });
}

export function useUpdateEducatorLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Pick<EducatorLesson, "title" | "description" | "type" | "artist" | "genre" | "order" | "isActive">>;
    }) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/lessons/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "lesson", variables.id] });
    },
  });
}

export function useReplaceEducatorLessonSegments() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, segments }: { id: string; segments: EducatorLessonSegment[] }) => {
      const token = await getToken();
      return apiFetch<{ success: true; count: number }>(`/educator/lessons/${id}/segments`, {
        method: "PUT",
        token,
        body: JSON.stringify({ segments }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lesson", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
    },
  });
}

export function useReplaceEducatorLessonAudio() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, audioUri, duration }: { id: string; audioUri: string; duration?: number }) => {
      const token = await getToken();
      const formData = new FormData();

      const fileName = audioUri.split("/").pop() ?? "lesson.m4a";
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "m4a";
      let mimeType = "audio/m4a";
      if (ext === "mp3") mimeType = "audio/mpeg";
      if (ext === "wav") mimeType = "audio/wav";

      formData.append("audio", {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      } as never);
      if (duration != null) {
        formData.append("duration", String(duration));
      }

      const res = await fetch(`${API_BASE_URL}/educator/lessons/${id}/audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      return res.json() as Promise<{ audioUrl: string }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lesson", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
    },
  });
}

export function useDeleteEducatorLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/educator/lessons/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });
}

export function useToggleCourseActive() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      return apiFetch<{ ok: true }>(`/educator/courses/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
    },
  });
}

export function useUpdateEducatorCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateEducatorCourseInput) => {
      const token = await getToken();
      return apiFetch<{ ok: true }>(`/educator/courses/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(fields),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
    },
  });
}

// ─── Proverbs ─────────────────────────────────────────────────────────────────

export interface Proverb {
  id: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr?: string | null;
  meaning: string;
  meaningFr?: string | null;
  literal?: string | null;
  context?: string | null;
  tags?: string[] | null;
}

export interface UpsertProverbInput {
  id?: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr?: string;
  meaning: string;
  meaningFr?: string;
  literal?: string;
  context?: string;
  tags?: string[];
}

export function useProverbs(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      const q = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<Proverb[]>(`/proverbs${q}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useUpsertProverb() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertProverbInput) => {
      const token = await getToken();
      const path = id ? `/proverbs/admin/${id}` : "/proverbs/admin";
      return apiFetch<Proverb>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proverbs"] });
    },
  });
}

export function useDeleteProverb() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/proverbs/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proverbs"] });
    },
  });
}

// ─── Cultural Content ──────────────────────────────────────────────────────────

export interface CulturalKeyTerm {
  word: string;
  english: string;
}

export interface CulturalHeadword {
  word: string;
  gloss?: LocalizedText | string;
  audioUrl?: string;
}

export interface CulturalHeroBand {
  label: string;
  sublabel?: LocalizedText | string;
  from: string;
  to: string;
  dark?: boolean;
}

export interface CulturalItem {
  id: string;
  languageId: string;
  category: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  imageEmoji: string;
  keyTerms?: CulturalKeyTerm[];
  featured?: boolean;
  headword?: CulturalHeadword | null;
  applications?: (LocalizedText | string)[] | null;
  heroBands?: CulturalHeroBand[] | null;
}

export interface UpsertCulturalInput {
  id?: string;
  languageId: string;
  category: string;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  imageEmoji: string;
  keyTerms?: CulturalKeyTerm[];
  featured?: boolean;
  headword?: CulturalHeadword | null;
  applications?: (LocalizedText | string)[] | null;
  heroBands?: CulturalHeroBand[] | null;
}

export function useCulturalItems(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<CulturalItem[]>({
    queryKey: ["cultural", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      const q = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<CulturalItem[]>(`/cultural${q}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useUpsertCulturalItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertCulturalInput) => {
      const token = await getToken();
      const path = id ? `/cultural/admin/${id}` : "/cultural/admin";
      return apiFetch<CulturalItem>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cultural"] });
    },
  });
}

export function useDeleteCulturalItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/cultural/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cultural"] });
    },
  });
}

// ─── Etymology Entries ────────────────────────────────────────────────────────

export interface UpsertEtymologyInput {
  id?: string;
  languageId: string;
  word: string;
  english: string;
  trail: Array<{ era: string; form: string; language: string; note: string }>;
}

export function useEtymologyEntries(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<import("@/types").EtymologyEntry[]>({
    queryKey: ["etymology", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      const q = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<import("@/types").EtymologyEntry[]>(`/etymology${q}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useUpsertEtymology() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertEtymologyInput) => {
      const token = await getToken();
      const path = id ? `/etymology/admin/${id}` : "/etymology/admin";
      return apiFetch<import("@/types").EtymologyEntry>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etymology"] });
    },
  });
}

export function useDeleteEtymology() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/etymology/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etymology"] });
    },
  });
}

// ─── Story Arcs ───────────────────────────────────────────────────────────────

export interface EducatorStoryArc {
  id: string;
  courseId: string;
  title: string;
  description: string;
  updatedAt?: string;
}

export interface EducatorStoryChapter {
  id?: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

export interface EducatorStoryArcDetail extends EducatorStoryArc {
  chapters: EducatorStoryChapter[];
}

export function useEducatorStoryArcs(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EducatorStoryArc[]>({
    queryKey: ["educator", "story-arcs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStoryArc[]>("/educator/story-arcs", { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useEducatorStoryArc(courseId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EducatorStoryArcDetail>({
    queryKey: ["educator", "story-arcs", courseId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStoryArcDetail>(`/educator/story-arcs/${courseId}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!courseId && enabled,
    staleTime: 30_000,
  });
}

export function useCreateStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { courseId: string; title: string; description: string }) => {
      const token = await getToken();
      return apiFetch<{ id: string }>("/educator/story-arcs", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useUpdateStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/story-arcs/${id}`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ title, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useDeleteStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/story-arcs/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useReplaceStoryChapters() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chapters }: { id: string; chapters: EducatorStoryChapter[] }) => {
      const token = await getToken();
      return apiFetch<{ success: true; count: number }>(`/educator/story-arcs/${id}/chapters`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ chapters }),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs", vars.id] });
    },
  });
}

export function useGenerateEducatorStubs() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      languageId,
      courseType,
    }: {
      languageId: string;
      courseType?: EducatorStubCourseType;
    }) => {
      const token = await getToken();
      return apiFetch<{ courses: number; lessons: number }>("/educator/generate-stubs", {
        method: "POST",
        token,
        body: JSON.stringify({ languageId, courseType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "stats"] });
    },
  });
}

// ── Sentence Templates ────────────────────────────────────────────────────────

export interface EducatorSentenceTemplate {
  id: string;
  languageId: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation: string | null;
}

export interface UpsertSentenceInput {
  id?: string;
  languageId: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation?: string;
}

export function useEducatorSentences(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<EducatorSentenceTemplate[]>({
    queryKey: ["educator", "sentences", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/sentences?languageId=${encodeURIComponent(languageId)}`, { token: token! });
    },
    enabled: !!languageId,
  });
}

export function useUpsertSentence() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertSentenceInput) => {
      const token = await getToken();
      return apiFetch<EducatorSentenceTemplate>("/educator/sentences", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "sentences", vars.languageId] });
      queryClient.invalidateQueries({ queryKey: ["sentences", vars.languageId] });
    },
  });
}

export function useDeleteSentence() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId }: { id: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/sentences/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "sentences", vars.languageId] });
      queryClient.invalidateQueries({ queryKey: ["sentences", vars.languageId] });
    },
  });
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

export interface ScenarioTurn {
  text: string;
  translation: string;
  audioUrl?: string;
}

export interface EducatorScenario {
  id: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertScenarioInput {
  id?: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
}

export function useEducatorScenarios(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<EducatorScenario[]>({
    queryKey: ["educator", "scenarios", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/scenarios?languageId=${encodeURIComponent(languageId)}`, { token: token! });
    },
    enabled: !!languageId,
  });
}

export function useCreateScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertScenarioInput) => {
      const token = await getToken();
      return apiFetch<EducatorScenario>("/educator/scenarios", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}

export function useUpdateScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId, ...patch }: { id: string; languageId: string; situation?: string; turns?: ScenarioTurn[] }) => {
      const token = await getToken();
      return apiFetch<EducatorScenario>(`/educator/scenarios/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(patch),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}

export function useDeleteScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId }: { id: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/scenarios/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}