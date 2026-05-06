import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proverbs — African Language Wisdom",
  description:
    "Explore proverbs and sayings in African languages. Discover their meanings, translations, and cultural context.",
  alternates: { canonical: "/proverbs" },
};

export default function ProverbsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
