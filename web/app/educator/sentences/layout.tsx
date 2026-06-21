import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentence Drills",
};

export default function EducatorSentencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
