import type { Metadata } from "next";
import { getRequestLocale, localeAlternates } from "@/lib/locale-meta";
import { EducatorLandingPage } from "@/components/landing/educator-landing-page";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Beeli for Educators — African Language Classroom Tools | Yoruba, Igbo, Swahili & More",
    description:
      "Free classroom tools for heritage language schools and university departments. Assign lessons, track student progress, and teach Yoruba, Igbo, Swahili, Amharic, Twi, Somali, and 70+ African languages.",
    alternates: localeAlternates(locale, "/for-educators"),
    openGraph: {
      title: "Beeli for Educators — African Language Classroom Tools",
      description:
        "Free classroom tools for heritage language schools. Assign lessons and track progress across 70+ African languages.",
      url: `${BASE_URL}/for-educators`,
      siteName: "Beeli (Aurufie)",
      type: "website",
    },
  };
}

export default function ForEducatorsPage() {
  return <EducatorLandingPage />;
}
