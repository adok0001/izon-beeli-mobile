import { apiFetch } from "@/lib/api";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
