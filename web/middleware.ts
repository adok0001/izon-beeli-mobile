import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_PREFIXES = ["fr", "pcm"] as const;
const LOCALE_COOKIE = "ui-language-store-lang";

export default clerkMiddleware(async (_auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const locale = LOCALE_PREFIXES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!locale) return;

  // Strip locale prefix and rewrite to the canonical path
  const rewritten = pathname === `/${locale}` ? "/" : pathname.slice(locale.length + 1);
  const url = req.nextUrl.clone();
  url.pathname = rewritten;

  const res = NextResponse.rewrite(url);
  // Pass locale to server components via header
  res.headers.set("x-locale", locale);
  // Sync locale to cookie so client hydration matches
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
