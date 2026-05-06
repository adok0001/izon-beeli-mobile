import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen — African Language Audio Lessons",
  description:
    "Stream audio lessons in Izon, Yoruba, Igbo, Hausa, Swahili, and more. Learn by listening to native speaker recordings.",
  alternates: { canonical: "/listen" },
  openGraph: {
    title: "Listen — African Language Audio Lessons",
    description: "Stream native speaker audio lessons across 75+ African languages.",
    url: "/listen",
    type: "website",
  },
};

export default function ListenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
