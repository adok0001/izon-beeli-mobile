import { AboutContent } from "@/components/about/about-content";
import { API_BASE_URL } from "@/lib/constants";

export const metadata = {
  title: "About Beeli — African Language Lexicography",
  description:
    "How Beeli is building the most comprehensive dictionary databases for African languages, developed with academic institutions and native speaker communities.",
};

export interface PublicStats {
  totalEntries: number;
  totalLanguages: number;
  entriesByLanguage: Array<{
    languageId: string;
    count: number;
    audioCount: number;
    audioPercent: number;
  }>;
  partnerCount: number;
  targetLanguages: Array<{
    languageId: string;
    count: number;
    target: number;
    percent: number;
  }>;
}

export interface ContentPartner {
  id: string;
  name: string;
  type: string;
  region: string | null;
  url: string | null;
  logoUrl: string | null;
  languageIds: string[];
}

async function fetchStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchPartners(): Promise<ContentPartner[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/partners`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const [stats, partners] = await Promise.all([fetchStats(), fetchPartners()]);
  return <AboutContent stats={stats} partners={partners} />;
}
