import type { ComponentType } from "react";
import { IzonSkit } from "@/components/marketing/izon-skit";
import { SkitSeventyVsFour } from "@/components/marketing/skit-seventy-vs-four";
import { SkitChallenge } from "@/components/marketing/skit-challenge";
import { SkitEducator } from "@/components/marketing/skit-educator";
import { SkitPreservation } from "@/components/marketing/skit-preservation";

export type SkitId = "izon" | "seventy" | "challenge" | "educator" | "preservation";

export type SkitEntry = {
  id: SkitId;
  label: string;
  blurb: string;
  /** Longer line for share/meta descriptions. */
  description: string;
  Component: ComponentType;
};

// Single source of truth for the marketing skits — consumed by the landing-page
// selector and the standalone /skits routes.
export const SKITS: readonly SkitEntry[] = [
  {
    id: "izon",
    label: "The Call",
    blurb: "A granddaughter learns to answer back.",
    description:
      "“The Call” — a diaspora granddaughter learns Ịzọn on Beeli and finally understands her grandmother. Your language, your roots.",
    Component: IzonSkit,
  },
  {
    id: "seventy",
    label: "4 → 70",
    blurb: "They teach four. We teach seventy.",
    description:
      "“4 → 70” — the world's biggest language app teaches four African languages. Beeli teaches seventy. Your language is one of them.",
    Component: SkitSeventyVsFour,
  },
  {
    id: "challenge",
    label: "#BeeliChallenge",
    blurb: "Earn your title. Then pass it on.",
    description:
      "“#BeeliChallenge” — level up, earn your title, and tag someone who should speak their language.",
    Component: SkitChallenge,
  },
  {
    id: "educator",
    label: "For Educators",
    blurb: "A free classroom, set up in two minutes.",
    description:
      "“Top of the Class” — a heritage-language teacher spins up a free Beeli classroom, and the kid who never practiced ends up top of the leaderboard.",
    Component: SkitEducator,
  },
  {
    id: "preservation",
    label: "Going Silent",
    blurb: "Some languages live only in their speakers.",
    description:
      "“Going Silent” — a language disappears every two weeks. Beeli teaches the ones you can't learn anywhere else, kept alive by their own speakers.",
    Component: SkitPreservation,
  },
] as const;

export function getSkit(id: string): SkitEntry | undefined {
  return SKITS.find((s) => s.id === id);
}
