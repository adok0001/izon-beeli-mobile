import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import {
  normalizeUiLanguage,
  UI_LANGUAGE_COOKIE,
  type UiLanguage,
} from "@/lib/ui-language";
import { en } from "@mobile/lib/locales/en";
import { fr } from "@mobile/lib/locales/fr";
import { pcm } from "@mobile/lib/locales/pcm";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const TRANSLATIONS = { en, fr, pcm } as const;

async function getUiLanguage(): Promise<UiLanguage> {
  const cookieStore = await cookies();
  return normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getUiLanguage();
  const copy = TRANSLATIONS[lang].web;

  return {
    title: {
      default: copy.metadataTitle,
      template: `%s | Beeli`,
    },
    description: copy.metadataDescription,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "https://izon-beeli.com"
    ),
    icons: {
      icon: "/favicon.svg",
    },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      siteName: "Beeli",
      type: "website",
      locale: lang === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary",
      title: copy.metadataTitle,
      description: copy.metadataDescription,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getUiLanguage();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Providers initialUiLanguage={lang}>{children}</Providers>
      </body>
    </html>
  );
}
