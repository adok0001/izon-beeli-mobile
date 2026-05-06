import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Culture & Music",
};

export default function CultureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
