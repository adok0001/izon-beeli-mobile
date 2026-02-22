import { useMemo } from "react";

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

// Mock contributor profiles for local phase
const MOCK_CONTRIBUTORS: ContributorProfile[] = [
  {
    id: "contrib-1",
    name: "Ebiere T.",
    approvedCount: 52,
    audioCount: 15,
    badges: ["first_contribution", "ten_words", "fifty_words", "audio_contributor"],
  },
  {
    id: "contrib-2",
    name: "Tamara A.",
    approvedCount: 34,
    audioCount: 8,
    badges: ["first_contribution", "ten_words", "audio_contributor"],
  },
  {
    id: "contrib-3",
    name: "Diepreye O.",
    approvedCount: 21,
    audioCount: 3,
    badges: ["first_contribution", "ten_words"],
  },
  {
    id: "contrib-4",
    name: "Mieibi K.",
    approvedCount: 12,
    audioCount: 0,
    badges: ["first_contribution", "ten_words"],
  },
  {
    id: "contrib-5",
    name: "Seiyefa B.",
    approvedCount: 5,
    audioCount: 2,
    badges: ["first_contribution", "audio_contributor"],
  },
];

export function useContributors() {
  const contributors = useMemo(
    () => [...MOCK_CONTRIBUTORS].sort((a, b) => b.approvedCount - a.approvedCount),
    []
  );

  return { data: contributors };
}
