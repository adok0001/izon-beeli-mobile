import type { Metadata } from "next";
import { getRequestLocale, localeAlternates } from "@/lib/locale-meta";
import { ContactPageClient } from "./contact-client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Contact — Partnerships & Institutional Access",
    description:
      "Get in touch with Beeli (Aurufie). Partner with us, request institutional access for your school or NGO, become a language partner, or send general feedback.",
    alternates: localeAlternates(locale, "/contact"),
    openGraph: {
      title: "Contact Beeli (Aurufie)",
      description:
        "Partner with us, request institutional access, or become a language partner for African language learning.",
      url: `${BASE_URL}/contact`,
      siteName: "Beeli (Aurufie)",
      type: "website",
    },
  };
}

export default function Page() {
  return <ContactPageClient />;
}
