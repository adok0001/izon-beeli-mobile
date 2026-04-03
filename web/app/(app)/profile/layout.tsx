import { AuthGate } from "@/components/auth-gate";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
