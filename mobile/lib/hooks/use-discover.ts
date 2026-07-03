import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DiscoverItem, InteractiveStory } from "@/types";
import { getInteractiveStory } from "@/lib/data/interactive-stories";

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
  return useQuery<InteractiveStory | null>({
    queryKey: ["interactive-story", id],
    queryFn: async () => getInteractiveStory(id),
    placeholderData: getInteractiveStory(id),
    staleTime: 1000 * 60 * 30,
  });
}
