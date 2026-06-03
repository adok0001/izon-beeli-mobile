import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { StoryArc } from "@/types";

interface StoryArcSummary {
  id: string;
  courseId: string;
  title: string;
}

export function useStoryArcs() {
  return useQuery<StoryArcSummary[]>({
    queryKey: ["story-arcs"],
    queryFn: () => apiFetch<StoryArcSummary[]>("/story-arcs"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useStoryArc(courseId: string) {
  return useQuery<StoryArc>({
    queryKey: ["story-arc", courseId],
    queryFn: () => apiFetch<StoryArc>(`/story-arcs/${encodeURIComponent(courseId)}`),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10,
  });
}
