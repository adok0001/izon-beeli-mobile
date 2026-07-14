import { apiFetch, apiFetchMultipart } from "@/lib/api";
import type { ContentStatus } from "@/lib/hooks/educator/use-content-workflow";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Presentation style of a season episode. Null for ordinary lessons. */
export type LessonStyle = "skit" | "immersive_story" | "host_narrated";

export interface EducatorLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string | LocalizedText;
  description: string | LocalizedText;
  type: string;
  audioUrl?: string | null;
  duration?: number | null;
  order: number;
  artist?: string | null;
  genre?: string | null;
  style?: LessonStyle | null;
  isActive?: boolean;
  status: ContentStatus;
  createdBy: string | null;
  publishAt?: string | null;
}

export interface EducatorLessonSegment {
  text: string;
  translation?: string | LocalizedText | null;
  translationFr?: string | null;
  startTime?: number;
  endTime?: number;
  order: number;
}

/**
 * A culture note attached to a lesson. `afterSegmentIndex` is a 0-based index
 * into the lesson's ordered transcript segments — the note renders inline right
 * after that line. Null means unanchored: it falls to the end of the transcript.
 */
export interface EducatorLessonCulturalAttachment {
  culturalContentId: string;
  afterSegmentIndex: number | null;
}

export interface EducatorLessonDetail extends EducatorLesson {
  segments: EducatorLessonSegment[];
  /** Flat id list, kept for callers that only need "which notes". */
  culturalContentIds: string[];
  /** The same attachments with their anchors — what the editor round-trips. */
  culturalAttachments?: EducatorLessonCulturalAttachment[];
}

export interface CreateEducatorLessonInput {
  languageId: string;
  courseId?: string;
  title: string;
  description: string;
  type?: string;
  artist?: string;
  genre?: string;
  /** Season episodes only — drives the style chip on the Series screen. */
  style?: LessonStyle | null;
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
      if (input.style) formData.append("style", input.style);
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

      return apiFetchMultipart<{ id: string }>("/educator/lessons", formData, { token });
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
      payload: Partial<
        Pick<EducatorLesson, "title" | "description" | "type" | "artist" | "genre" | "style" | "order" | "isActive" | "status">
      >;
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

export function useReplaceEducatorLessonCulturalContent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, attachments }: { id: string; attachments: EducatorLessonCulturalAttachment[] }) => {
      const token = await getToken();
      // The endpoint's `culturalContentIds` key accepts either bare ids or the
      // object form; we always send objects so the anchor round-trips.
      return apiFetch<{ success: true; count: number }>(`/educator/lessons/${id}/cultural-content`, {
        method: "PUT",
        token,
        body: JSON.stringify({ culturalContentIds: attachments }),
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

      return apiFetchMultipart<{ audioUrl: string }>(`/educator/lessons/${id}/audio`, formData, { token });
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
