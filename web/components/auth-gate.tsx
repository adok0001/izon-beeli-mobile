"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Wraps app pages: renders children for signed-in users,
 * and a sign-in prompt for guests (Google can still crawl the shell).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  // While Clerk initialises, render nothing (avoids flash)
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
        <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
          <Lock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Sign in to continue
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
            Create a free account to access lessons, audio, community feed, and more.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <SignInButton mode="redirect">
            <button className="px-6 py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              Sign in
            </button>
          </SignInButton>
          <Link
            href="/sign-up"
            className="px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:border-brand-400 transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
