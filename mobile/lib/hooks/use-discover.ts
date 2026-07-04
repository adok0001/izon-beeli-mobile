import { apiFetch, isNetworkError } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DiscoverItem, InteractiveStory } from "@/types";
import { useIsOffline } from "@/lib/hooks/use-offline";
import { getSnapshotInteractiveStory } from "@/store/content-store";

export type DiscoverFilter = "all" | "blog" | "podcast" | "film";

export function useDiscover(filter: DiscoverFilter = "all") {
  const query = useQuery<DiscoverItem[]>({
    queryKey: ["culture-items", filter],
    queryFn: () => {
      const qs = filter === "all" ? "" : `?type=${filter}`;
      return apiFetch<DiscoverItem[]>(`/culture-items${qs}`);
    },
    staleTime: 1000 * 60 * 10,
  });

  const all = query.data ?? [];
  const filtered = filter === "all" ? all : all.filter((i) => i.type === filter);
  const featured = filtered.filter((i) => i.featured);
  const rest = filtered.filter((i) => !i.featured);

  return { ...query, featured, rest, all: filtered };
}

export function useInteractiveStory(id: string) {
  const isOffline = useIsOffline();

  return useQuery<InteractiveStory | null>({
    queryKey: ["interactive-story", id],
    queryFn: async () => {
      if (isOffline) return getSnapshotInteractiveStory(id);
      try {
        return await apiFetch<InteractiveStory>(
          `/interactive-stories/story/${encodeURIComponent(id)}`
        );
      } catch (err) {
        if (isNetworkError(err)) return getSnapshotInteractiveStory(id);
        throw err;
      }
    },
    placeholderData: getSnapshotInteractiveStory(id),
    staleTime: 1000 * 60 * 30,
  });
}

/** All active interactive stories — used by the admin story-health overview. */
export function useInteractiveStories() {
  return useQuery<InteractiveStory[]>({
    queryKey: ["interactive-stories"],
    queryFn: () => apiFetch<InteractiveStory[]>("/interactive-stories"),
    staleTime: 1000 * 60 * 10,
  });
}
