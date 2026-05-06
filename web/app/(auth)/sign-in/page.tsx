import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-xl rounded-2xl border border-neutral-200 dark:border-neutral-800",
        },
      }}
    />
  );
}
