import type { Metadata } from "next";
import { EducatorLandingPage } from "@/components/landing/educator-landing-page";

export const metadata: Metadata = {
  title: "Beeli for Educators — African Language Classroom Tools | Yoruba, Igbo, Swahili & More",
  description:
    "Free classroom tools for heritage language schools and university departments. Assign lessons, track student progress, and teach Yoruba, Igbo, Swahili, Amharic, Twi, Somali, and 70+ African languages.",
  alternates: { canonical: "/for-educators" },
};

export default function ForEducatorsPage() {
  return <EducatorLandingPage />;
}
