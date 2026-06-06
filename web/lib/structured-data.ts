/**
 * Helpers for building schema.org JSON-LD objects.
 * Render the returned object inside a
 * `<Script type="application/ld+json">{JSON.stringify(...)}</Script>`.
 */

export const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export const ORGANIZATION_NAME = "Aurufie (Beeli)";

type Crumb = { name: string; path: string };

/**
 * BreadcrumbList — gives search engines the page hierarchy and can produce
 * breadcrumb rich results. `path` is the route (e.g. "/learn/izon"); it's
 * resolved against the site base URL.
 */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_BASE_URL}${c.path}`,
    })),
  };
}

type ArticleInput = {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  url: string;
};

/**
 * BlogPosting — one per editorial post on the Culture/media page.
 */
export function blogPostingJsonLd(a: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    author: { "@type": "Person", name: a.author },
    datePublished: a.datePublished,
    url: a.url,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      url: SITE_BASE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_BASE_URL}/favicon.svg` },
    },
  };
}
