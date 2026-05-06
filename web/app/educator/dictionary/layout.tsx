import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dictionary",
};

export default function EducatorDictionaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
