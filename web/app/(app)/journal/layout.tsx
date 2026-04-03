import { AuthGate } from "@/components/auth-gate";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
