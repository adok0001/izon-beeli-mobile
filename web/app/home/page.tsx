import type { Metadata } from "next";
import AurufieLandingPage from "@/components/landing/aurufie-landing-page";

export const metadata: Metadata = {
  title: "Aurufie — African Language Learning",
  description:
    "Aurufie (Beeli) is a free, audio-first platform for learning 70+ African languages — built with native speakers across the Niger Delta, the Horn, and the diaspora.",
  alternates: { canonical: "/home" },
  openGraph: {
    title: "Aurufie — African Language Learning",
    description:
      "Free, audio-first learning for 70+ African languages, built with native speakers.",
    url: "https://izon-beeli.com/home",
    siteName: "Beeli (Aurufie)",
    type: "website",
  },
};

export default function HomePage() {
  return <AurufieLandingPage />;
}
