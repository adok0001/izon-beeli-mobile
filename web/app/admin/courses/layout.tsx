import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
};

export default function AdminCoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
