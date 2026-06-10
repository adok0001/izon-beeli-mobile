import type { Metadata } from "next";
import Script from "next/script";
import { CulturePage } from "./culture-client";
import type { DiscoverItem } from "./culture-client";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  SITE_BASE_URL,
} from "@/lib/structured-data";
import { API_BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Culture — Essays, Podcasts & Films",
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

async function getCultureItems(): Promise<DiscoverItem[]> {
  const res = await fetch(`${API_BASE_URL}/culture-items`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function Page() {
  const items = await getCultureItems();

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Culture", path: "/culture" },
  ]);

  const blogPostsLd = items.filter((i) => i.type === "blog").map((i) =>
    blogPostingJsonLd({
      title: i.title,
      description: i.description,
      author: i.author,
      datePublished: i.publishedAt,
      url: i.contentUrl ?? `${SITE_BASE_URL}/culture`,
    })
  );

  return (
    <>
      <Script id="ld-culture-breadcrumb" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      {blogPostsLd.map((ld, i) => (
        <Script
          key={ld.url ?? i}
          id={`ld-culture-post-${i}`}
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(ld)}
        </Script>
      ))}
      <CulturePage />
    </>
  );
}
