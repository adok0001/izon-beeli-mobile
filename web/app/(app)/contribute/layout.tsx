import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute — Help Document African Languages",
  description:
    "Add words, phrases, audio recordings, and translations to grow the African language database. Your contributions reach thousands of learners.",
  alternates: { canonical: "/contribute" },
  openGraph: {
    title: "Contribute — Help Document African Languages",
    description: "Add words, audio, and translations. Every contribution counts.",
    url: "/contribute",
    type: "website",
  },
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
