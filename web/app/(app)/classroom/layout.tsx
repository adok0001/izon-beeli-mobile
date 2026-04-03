import { AuthGate } from "@/components/auth-gate";

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
