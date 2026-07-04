import type { Metadata } from "next";
import { StudioShell } from "../(studio)/_components/studio-shell";

export const metadata: Metadata = {
  title: { default: "Admin Panel", template: "%s | Admin — Beeli" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell access="admin">{children}</StudioShell>;
}
