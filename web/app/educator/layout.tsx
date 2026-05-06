import type { Metadata } from "next";
import { EducatorShell } from "./_components/educator-shell";

export const metadata: Metadata = {
  title: { default: "Educator Panel", template: "%s | Educator — Beeli" },
  robots: { index: false, follow: false },
};

export default function EducatorLayout({ children }: { children: React.ReactNode }) {
  return <EducatorShell>{children}</EducatorShell>;
}
