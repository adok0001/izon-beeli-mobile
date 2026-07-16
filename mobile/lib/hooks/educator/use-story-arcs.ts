import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EducatorStoryArc {
  id: string;
  courseId: string | null;
  languageId: string | null;
  title: string;
  description: string;
  /** Target-language season title, e.g. "Bou Mie". */
  nativeTitle?: string | null;
  /** One-line hook shown on the Series screen. */
  logline?: string | null;
  status?: string;
  createdBy?: string;
  updatedAt?: string;
}

/** A recurring character. `castId` is what a transcript segment's `speaker` refers to. */
export interface EducatorStoryCastMember {
  castId: string;
  name: string;
  role: string;
  /** Categorical accent tinting the avatar (see constants/accent-colors). */
  hue: string;
}

/** Accents a cast avatar can take. Mirrors `AccentHue`; the server rejects anything else. */
export const CAST_HUES = [
  "rose", "purple", "blue", "teal", "indigo",
  "orange", "green", "amber", "sky", "pink", "fuchsia",
] as const;

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
  cast: EducatorStoryCastMember[];
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

/**
 * Load a season by its own id.
 *
 * The only way to open a STANDALONE season — one with no owning course, like a
 * cross-course podcast narrative. Looking arcs up by courseId can't reach those,
 * which is why the editor used to refuse them outright.
 */
export function useEducatorStoryArcById(arcId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EducatorStoryArcDetail>({
    queryKey: ["educator", "story-arcs", "arc", arcId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStoryArcDetail>(`/educator/story-arcs/arc/${arcId}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!arcId && enabled,
    staleTime: 30_000,
  });
}

export function useCreateStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      /** Omit for a standalone season — a cross-course narrative with no owning course. */
      courseId?: string;
      languageId?: string;
      title: string;
      description: string;
      nativeTitle?: string;
      logline?: string;
    }) => {
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
    mutationFn: async ({
      id,
      ...fields
    }: {
      id: string;
      title?: string;
      description?: string;
      nativeTitle?: string | null;
      logline?: string | null;
      /** Editors may move an arc between draft/in_review/archived; publishing goes through usePublishContent. */
      status?: string;
    }) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/story-arcs/${id}`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify(fields),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

/** Replace the season's cast wholesale — the editor owns the whole list. */
export function useReplaceStoryCast() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cast }: { id: string; cast: EducatorStoryCastMember[] }) => {
      const token = await getToken();
      return apiFetch<{ success: true; count: number }>(`/educator/story-arcs/${id}/cast`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ cast }),
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
