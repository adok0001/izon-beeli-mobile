import type { Metadata } from "next";
import { StudioShell } from "../(studio)/_components/studio-shell";

export const metadata: Metadata = {
  title: { default: "Educator Panel", template: "%s | Educator — Beeli" },
  robots: { index: false, follow: false },
};

export default function EducatorLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell access="reviewer">{children}</StudioShell>;
}
