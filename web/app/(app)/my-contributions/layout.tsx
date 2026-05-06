import { AuthGate } from "@/components/auth-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Contributions",
  robots: { index: false, follow: false },
};

export default function MyContributionsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
