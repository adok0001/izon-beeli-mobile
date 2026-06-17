import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { getSkit, SKITS } from "@/components/marketing/skit-registry";

// The skits are built around Bricolage Grotesque (display) + Hanken Grotesk (text).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-skit-display",
  display: "swap",
});
const text = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-skit-text",
  display: "swap",
});

export function generateStaticParams() {
  return SKITS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const skit = getSkit(id);
  if (!skit) return { title: "Skit not found — Beeli" };
  return {
    title: `${skit.label} — Beeli`,
    description: skit.description,
    openGraph: { title: `${skit.label} — Beeli`, description: skit.description, type: "video.other" },
  };
}

export default async function SkitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skit = getSkit(id);
  if (!skit) notFound();
  const Skit = skit.Component;
  return (
    <main
      className={`${display.variable} ${text.variable}`}
      style={{ position: "fixed", inset: 0, background: "#0a0a0a" }}
    >
      <Skit />
    </main>
  );
}
