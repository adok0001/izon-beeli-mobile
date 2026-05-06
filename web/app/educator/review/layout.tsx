import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Queue",
};

export default function EducatorReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
