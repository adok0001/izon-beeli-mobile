import type { Metadata } from "next";
import { getRequestLocale, localeAlternates } from "@/lib/locale-meta";
import AurufieLandingPage from "@/components/landing/aurufie-landing-page";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Aurufie — African Language Learning",
    description:
      "Aurufie (Beeli) is a free, audio-first platform for learning 70+ African languages — built with native speakers across the Niger Delta, the Horn, and the diaspora.",
    alternates: localeAlternates(locale, "/home"),
    openGraph: {
      title: "Aurufie — African Language Learning",
      description:
        "Free, audio-first learning for 70+ African languages, built with native speakers.",
      url: `${BASE_URL}/home`,
      siteName: "Beeli (Aurufie)",
      type: "website",
    },
  };
}

export default function HomePage() {
  return <AurufieLandingPage />;
}
