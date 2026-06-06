import { AuthGate } from "@/components/auth-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Apps",
  robots: { index: false, follow: false },
};

export default function MiniAppsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
