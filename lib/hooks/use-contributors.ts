import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ContributorProfile {
  id: string;
  name: string;
  approvedCount: number;
  audioCount: number;
  badges: ContributorBadgeType[];
}

export type ContributorBadgeType =
  | "first_contribution"
  | "ten_words"
  | "fifty_words"
  | "audio_contributor"
  | "multi_language";

const BADGE_LABELS: Record<ContributorBadgeType, { label: string; icon: string }> = {
  first_contribution: { label: "First Word", icon: "star.fill" },
  ten_words: { label: "10 Words", icon: "flame.fill" },
  fifty_words: { label: "50 Words", icon: "trophy.fill" },
  audio_contributor: { label: "Audio Pro", icon: "mic.fill" },
  multi_language: { label: "Polyglot", icon: "globe" },
};

export { BADGE_LABELS };

interface RawContributor {
  id: string;
  name: string;
  approvedCount: number;
}

function deriveBadges(approvedCount: number): ContributorBadgeType[] {
  const badges: ContributorBadgeType[] = ["first_contribution"];
  if (approvedCount >= 10) badges.push("ten_words");
  if (approvedCount >= 50) badges.push("fifty_words");
  return badges;
}

export function useContributors(languageId?: string) {
  return useQuery<ContributorProfile[]>({
    queryKey: ["contributors", languageId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (languageId) params.set("languageId", languageId);
      const raw = await apiFetch<RawContributor[]>(`/contributors?${params}`);
      return raw.map((r) => ({
        id: r.id,
        name: r.name,
        approvedCount: r.approvedCount,
        audioCount: 0, // not tracked per-language in v1
        badges: deriveBadges(r.approvedCount),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
