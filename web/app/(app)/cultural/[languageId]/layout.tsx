import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cultural Guide",
  robots: { index: false, follow: false },
};

export default function CulturalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
