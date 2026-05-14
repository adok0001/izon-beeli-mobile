import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
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

export type EducatorDictionaryCategory =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "greeting"
  | "phrase"
  | "number"
  | "color"
  | "body"
  | "food"
  | "family"
  | "nature"
  | "animal"
  | "place"
  | "other";

export interface EducatorDictionaryEntry {
  id: string;
  languageId: string;
  word: string;
  english: string;
  french?: string | null;
  category: EducatorDictionaryCategory;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  exampleTranslationFr?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  _source?: "contribution";
}

export interface UpsertEducatorDictionaryInput {
  id?: string;
  languageId: string;
  word: string;
  english: string;
  category: EducatorDictionaryCategory;
  french?: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  exampleTranslationFr?: string;
  audioUri?: string;
  imageUri?: string;
}

export interface EducatorCourse {
  id: string;
  title: string;
  description: string;
  languageId: string;
  level: string;
  order: number;
  courseType?: string | null;
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
        throw new Error(`API error ${res.status}: ${text}`);
      }

      return res.json() as Promise<EducatorDictionaryEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
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