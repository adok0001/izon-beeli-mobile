import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn African Languages — Audio Courses & Lessons",
  description:
    "Learn Izon, Yoruba, Igbo, Hausa, Swahili, and 75+ African languages. Free audio lessons, vocabulary drills, and quizzes on Aurufie.",
  alternates: { canonical: "/learn" },
  keywords: [
    "learn African languages",
    "African language app",
    "learn Izon",
    "learn Yoruba",
    "learn Igbo",
    "Niger Delta languages",
    "Aurufie",
  ],
  openGraph: {
    title: "Learn African Languages — Audio Courses & Lessons",
    description:
      "Free audio lessons for Izon, Yoruba, Igbo, Hausa, Swahili and more. Start learning today.",
    url: "/learn",
    type: "website",
  },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
