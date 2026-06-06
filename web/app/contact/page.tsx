import type { Metadata } from "next";
import { ContactPageClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact — Partnerships & Institutional Access",
  description:
    "Get in touch with Beeli (Aurufie). Partner with us, request institutional access for your school or NGO, become a language partner, or send general feedback.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Beeli (Aurufie)",
    description:
      "Partner with us, request institutional access, or become a language partner for African language learning.",
    url: "https://izon-beeli.com/contact",
    siteName: "Beeli (Aurufie)",
    type: "website",
  },
};

export default function Page() {
  return <ContactPageClient />;
}
