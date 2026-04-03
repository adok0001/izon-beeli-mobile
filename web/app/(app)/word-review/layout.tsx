import { AuthGate } from "@/components/auth-gate";

export default function WordReviewLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
