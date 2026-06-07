# Beeli — Technical SEO & Monitoring

The web app uses **Next.js 15 App Router**. All SEO primitives (metadata,
sitemap, robots, OG images) are implemented natively via the App Router API
— no `next-sitemap` package needed.

---

## Current SEO Infrastructure — What's Already Built

These are confirmed in the codebase. Do not duplicate:

| Feature | File | Status |
|---|---|---|
| Metadata API (title, description, OG, Twitter) | `web/app/layout.tsx` | ✅ Done |
| Multi-language metadata (en, fr, pcm) | `web/app/layout.tsx` | ✅ Done |
| Organization + WebSite + SoftwareApplication JSON-LD | `web/app/layout.tsx` | ✅ Done |
| Dynamic OG image (edge-rendered, 1200×630) | `web/app/opengraph-image.tsx` | ✅ Done |
| robots.txt (disallows auth, dashboard, admin) | `web/app/robots.ts` | ✅ Done |
| sitemap.xml (26 routes with priorities) | `web/app/sitemap.ts` | ✅ Done |
| Twitter card (summary_large_image) | `web/app/layout.tsx` | ✅ Done |
| Googlebot-specific directives | `web/app/layout.tsx` | ✅ Done |

---

## Core Web Vitals Targets

| Metric | Target | What it means |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Main content loads fast |
| INP (Interaction to Next Paint) | < 200ms | Page feels responsive |
| CLS (Cumulative Layout Shift) | < 0.1 | No content jumping on load |

**Test at:** pagespeed.web.dev — test mobile AND desktop. Target "Good" on both.

---

## Next.js 15 App Router SEO Patterns

### Metadata per page
```tsx
// web/app/learn/izon/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learn Izon Language Online — Free Lessons | Beeli',
  description: 'Beeli is the only app with structured Izon lessons. Learn words, phrases, and grammar from native speakers. Free to start — no download required.',
  openGraph: {
    title: 'Learn Izon Language Online — Free Lessons',
    description: 'The only platform with structured Izon lessons from native speakers.',
    url: 'https://izon-beeli.com/learn/izon',
  },
  alternates: {
    canonical: 'https://izon-beeli.com/learn/izon',
    languages: {
      'fr': 'https://izon-beeli.com/fr/learn/izon',
      'x-default': 'https://izon-beeli.com/learn/izon',
    },
  },
}
```

### Image optimisation
```tsx
import Image from 'next/image'

// Always use next/image — never <img> tags
<Image
  src="/images/izon-lesson-beeli-app.jpg"
  alt="Student completing an Izon language quiz on the Beeli app"
  width={800}
  height={600}
  priority={isAboveFold}
  loading={isAboveFold ? "eager" : "lazy"}
/>

// next.config.js — image formats
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 768, 1200, 1920],
  }
}
```

**Performance rules:**
- Hero/above-fold image: `priority={true}`, < 200KB
- All other images: lazy load, < 100KB
- Never inline base64 images above the fold
- Defer analytics (PostHog) and non-critical JS

### JSON-LD structured data
Inject per-page schema via a server component — don't put all schema in root layout:
```tsx
// In a page or layout component
export default function IzonLearnPage() {
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Izon Language Course',
    // ...
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      {/* page content */}
    </>
  )
}
```

---

## Schema Markup Types to Implement

| Page | Schema Type | Priority |
|---|---|---|
| All pages | `SoftwareApplication` (in root layout — ✅ done) | Critical |
| `/` | `WebSite` with `SearchAction` | High |
| `/learn/izon` | `Course` | High |
| `/dictionary/izon` | `Dataset` or `DefinedTermSet` | Medium |
| `/for-educators` | `EducationalOrganization` | High |
| Blog posts | `Article` + `FAQPage` (if FAQ section) | High |
| `/leaderboard` | None needed | Low |
| `/contribute` | `ItemList` for bounties | Low |

**WebSite schema with SearchAction (enables Google sitelinks search):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Beeli",
  "url": "https://izon-beeli.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://izon-beeli.com/dictionary/izon?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## Sitemap Maintenance (`web/app/sitemap.ts`)

The sitemap currently has 26 routes. When adding new public pages:
1. Add the route to `sitemap.ts` with appropriate priority and changefreq
2. Set priority: home=1.0, language learn pages=0.9, dictionary=0.8, support/privacy=0.3
3. Language-specific pages (e.g. `/learn/izon`) get `changefreq: 'weekly'`
4. Blog posts get `changefreq: 'monthly'` once published

---

## robots.txt (`web/app/robots.ts`)

Currently disallows: `/dashboard`, `/profile`, `/settings`, `/feed`, auth flows, `/admin`.

When adding new protected/internal routes, add them to the Disallow list.
Public SEO pages must **not** be in the Disallow list.

---

## OG Image (`web/app/opengraph-image.tsx`)

Currently edge-rendered with dark gradient + purple accent, app icon, name,
tagline ("Learn African languages. Preserve your heritage."), and domain.

For page-specific OG images (e.g. `/learn/izon`), create
`web/app/learn/izon/opengraph-image.tsx` following the same pattern with the
language name and a relevant image.

---

## Canonical Tags

Next.js App Router sets canonicals via `alternates.canonical` in `Metadata`.
Every page that might be accessible via multiple URLs must have a canonical.

Rules:
- Always canonical to the non-www, https version
- Language variants use `alternates.languages`, not separate canonicals
- Paginated content: canonical on page 1, `next`/`prev` links for the rest

---

## Mobile SEO

Beeli is a mobile-first app — the web must meet mobile standards:
- Tap targets minimum 48×48px
- Body text minimum 16px
- No horizontal scroll
- `theme-color` meta tag: matches the app's dark theme (`#0D0D0D` or current brand color)

---

## Google Search Console Setup

- Property: `https://izon-beeli.com`
- Verify via DNS TXT record
- Submit sitemap: `https://izon-beeli.com/sitemap.xml`
- Set primary target country: international (not country-restricted — diaspora is global)

---

## Monitoring Cadence

| Frequency | Task |
|---|---|
| Weekly | Check GSC for crawl errors, 404s, new ranking queries |
| Weekly | Check GSC impressions for Izon-related queries — watch for growth |
| Monthly | Review PostHog for organic landing pages and conversion to sign-up |
| Monthly | Run PageSpeed Insights on `/`, `/learn/izon`, `/dictionary/izon` |
| Monthly | Check app store keyword rankings (iOS App Store Connect, Google Play Console) |
| Quarterly | Audit sitemap — add new pages, remove deleted ones |
| Quarterly | Review all structured data with Google's Rich Results Test |
| Quarterly | Check for new Izon/African language competitors entering the SERP |

---

## PostHog SEO Events to Track

```ts
posthog.capture('organic_landing', {
  page: window.location.pathname,
  referrer: document.referrer,
})
posthog.capture('lesson_start_from_organic')   // Organic visitor started a lesson
posthog.capture('app_install_click', { platform: 'ios' | 'android' })
posthog.capture('dictionary_search', { term, language: 'izon' })
```

The ratio of `lesson_start_from_organic` to `app_install_click` tells you
whether the web SEO is converting learners or just driving installs.
