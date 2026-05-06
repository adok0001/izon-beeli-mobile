import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz — Test Your African Language Skills",
  description:
    "Challenge yourself with vocabulary quizzes in Izon, Yoruba, Igbo, Hausa, and more. Track your progress and reinforce what you've learned.",
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: "Quiz — Test Your African Language Skills",
    description: "Vocabulary quizzes for 75+ African languages. Test and track your progress.",
    url: "/quiz",
    type: "website",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
