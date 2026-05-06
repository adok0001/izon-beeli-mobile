import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course",
  robots: { index: false, follow: false },
};

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
