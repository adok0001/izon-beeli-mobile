import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bounties — Earn Rewards by Contributing African Language Content",
  description:
    "Complete language contribution bounties and earn rewards. Help document African languages by adding words, recordings, and translations.",
  alternates: { canonical: "/bounties" },
  openGraph: {
    title: "Bounties — Earn Rewards Contributing African Languages",
    description: "Get rewarded for contributing words, audio, and translations.",
    url: "/bounties",
    type: "website",
  },
};

export default function BountiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
