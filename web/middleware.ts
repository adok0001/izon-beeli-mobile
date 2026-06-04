import { clerkMiddleware } from "@clerk/nextjs/server";

// All routes are public — auth is handled client-side in AuthGate.
// This allows Google to index all pages without requiring sign-in.
// In Clerk v6, an empty handler keeps all routes public.
export default clerkMiddleware(async () => {});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
