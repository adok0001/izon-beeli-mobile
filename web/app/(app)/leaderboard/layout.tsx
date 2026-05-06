import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top African Language Learners",
  description:
    "See the top learners and contributors in the Aurufie community. Climb the ranks by completing lessons and contributing to African language documentation.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Leaderboard — Top African Language Learners",
    description: "Compete with learners worldwide and climb the Aurufie leaderboard.",
    url: "/leaderboard",
    type: "website",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
