import type { Metadata } from "next";
import Link from "next/link";
import { SKITS } from "@/components/marketing/skit-registry";

export const metadata: Metadata = {
  title: "Skits — Beeli",
  description: "Short vertical stories about learning African languages on Beeli.",
};

export default function SkitsIndexPage() {
  return (
    <main className="min-h-screen bg-[#06060e] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-4xl sm:text-5xl">Skits</h1>
        <p className="mt-4 text-neutral-400 text-lg">
          Short vertical stories (9:16) about learning African languages on Beeli.
        </p>
        <ul className="mt-12 grid gap-4">
          {SKITS.map((s) => (
            <li key={s.id}>
              <Link
                href={`/skits/${s.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:bg-white/[0.07]"
              >
                <span className="font-display font-bold text-2xl text-white">{s.label}</span>
                <span className="mt-1 block text-neutral-400">{s.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
