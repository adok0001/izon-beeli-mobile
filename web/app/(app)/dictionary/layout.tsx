import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "African Language Dictionary — Words, Translations & Audio",
  description:
    "Browse 10,000+ words across 75+ African languages. English and French translations, pronunciation guides, audio recordings, and example sentences.",
  alternates: { canonical: "/dictionary" },
  keywords: [
    "African language dictionary",
    "Izon dictionary",
    "Yoruba dictionary",
    "Igbo dictionary",
    "Niger Delta language words",
    "African vocabulary",
  ],
  openGraph: {
    title: "African Language Dictionary — Words, Translations & Audio",
    description:
      "Browse African language vocabulary with translations, audio, and examples.",
    url: "/dictionary",
    type: "website",
  },
};

export default function DictionaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
