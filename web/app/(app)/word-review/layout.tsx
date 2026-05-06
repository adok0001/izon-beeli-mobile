import { AuthGate } from "@/components/auth-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Review",
  robots: { index: false, follow: false },
};

export default function WordReviewLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
