import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lessons",
};

export default function EducatorLessonsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
