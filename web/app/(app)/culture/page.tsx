import type { Metadata } from "next";
import { CulturePage } from "./culture-client";

export const metadata: Metadata = {
  title: "Culture — Essays, Podcasts & Films | Beeli",
  description:
    "Beeli's media hub: essays, conversations, and documentary films from inside the world of African languages. Written and produced by the Beeli team.",
  alternates: { canonical: "/culture" },
  openGraph: {
    title: "Culture — Beeli Media",
    description:
      "Essays, conversations, and films from inside the world of African languages.",
    url: "https://izon-beeli.com/culture",
    siteName: "Beeli",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culture — Beeli Media",
    description:
      "Essays, conversations, and films from inside the world of African languages.",
  },
};

export default function Page() {
  return <CulturePage />;
}
