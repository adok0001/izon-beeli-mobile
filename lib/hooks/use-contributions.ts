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

export interface BulkContributionEntry {
  word: string;
  english: string;
  category: DictionaryCategory;
  pronunciation?: string;
}

export function useBulkSubmitContribution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      languageId,
      entries,
    }: {
      languageId: string;
      entries: BulkContributionEntry[];
    }) => {
      const token = await getToken();
      return apiFetch<{ inserted: number }>("/contributions/bulk", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ languageId, entries }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["approved-words"] });
    },
  });
}

export function useApprovedWords(languageId: string) {
  return useQuery<DictionaryEntry[]>({
    queryKey: ["approved-words", languageId],
    queryFn: () =>
      apiFetch<DictionaryEntry[]>(
        `/contributions/approved?languageId=${languageId}`
      ),
    enabled: !!languageId,
  });
}

export function usePendingContributions() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["pending-contributions"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<PendingContribution[]>("/contributions/pending", {
        token: token!,
      });
    },
  });
}

export interface PendingContribution {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  pronunciation: string | null;
  example: string | null;
  exampleTranslation: string | null;
  type: string;
  status: string;
  userId: string;
  createdAt: string;
}

export function useReviewContribution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: string;
      action: "approve" | "reject";
      note?: string;
    }) => {
      const token = await getToken();
      return apiFetch(`/contributions/${id}/review`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ action, note }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["approved-words"] });
    },
  });
}

// ---------- Lesson Contributions ----------

export interface LessonContributionSegmentInput {
  text: string;
  translation?: string;
  startTime?: number;
  endTime?: number;
  order: number;
}

export interface LessonContributionInput {
  languageId: string;
  courseId?: string;
  title: string;
  description: string;
  audioUri: string;
  duration?: number;
  segments: LessonContributionSegmentInput[];
}

export interface PendingLessonContributionSegment {
  id: string;
  lessonContributionId: string;
  text: string;
  translation: string | null;
  startTime: number | null;
  endTime: number | null;
  order: number;
}

export interface PendingLessonContribution {
  id: string;
  userId: string;
  languageId: string;
  courseId: string | null;
  title: string;
  description: string;
  audioUrl: string;
  duration: number | null;
  status: string;
  createdAt: string;
  userName: string | null;
  segments: PendingLessonContributionSegment[];
}

export function useSubmitLessonContribution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LessonContributionInput) => {
      const token = await getToken();
      const formData = new FormData();

      formData.append("languageId", input.languageId);
      if (input.courseId) formData.append("courseId", input.courseId);
      formData.append("title", input.title);
      formData.append("description", input.description);
      if (input.duration != null) formData.append("duration", String(input.duration));
      formData.append("segments", JSON.stringify(input.segments));

      const filename = input.audioUri.split("/").pop() ?? "lesson.m4a";
      const ext = filename.split(".").pop()?.toLowerCase() ?? "m4a";
      const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : "audio/m4a";

      formData.append("audio", {
        uri: input.audioUri,
        type: mimeType,
        name: filename,
      } as any);

      const res = await fetch(`${API_BASE_URL}/lesson-contributions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["pending-lesson-contributions"] });
    },
  });
}

export function usePendingLessonContributions() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["pending-lesson-contributions"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<PendingLessonContribution[]>("/lesson-contributions/pending", {
        token: token!,
      });
    },
  });
}

export function useReviewLessonContribution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: string;
      action: "approve" | "reject";
      note?: string;
    }) => {
      const token = await getToken();
      return apiFetch(`/lesson-contributions/${id}/review`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ action, note }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-lesson-contributions"] });
    },
  });
}

export interface MyContribution {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  type: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

export function useMyContributions() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["my-contributions"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<MyContribution[]>("/contributions", { token: token! });
    },
  });
}
