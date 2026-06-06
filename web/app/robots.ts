import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          // User-specific pages (have metadata noindex)
          "/dashboard",
          "/profile",
          "/settings",
          "/journal",
          "/my-contributions",
          "/word-review",
          "/feed",
          "/classroom",
          "/explore",
          "/mini-apps",
          // Auth flows
          "/sign-in",
          "/sign-up",
          // Admin areas
          "/admin",
          "/educator",
          // API routes
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}