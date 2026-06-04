import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Learn African Languages — Yoruba, Igbo, Swahili, Hausa, Amharic & 70+ More | Beeli",
  description:
    "Beeli is a free African language learning app with audio-first lessons in 70+ languages: Yoruba, Igbo, Swahili, Hausa, Amharic, Izon, Twi, Wolof, Somali, and more. Built with native speakers.",
  alternates: { canonical: "/" },
};

export default function RootPage() {
  return <LandingPage />;
}
