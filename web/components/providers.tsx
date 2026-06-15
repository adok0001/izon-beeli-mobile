"use client";

import i18n from "@/lib/i18n";
import { getQueryClient } from "@/lib/query-client";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { isRtlLanguage, type UiLanguage } from "@/lib/ui-language";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { arSA, frFR, ptBR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/posthog-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
  initialUiLanguage: UiLanguage;
}>;

const CLERK_LOCALIZATIONS: Partial<Record<UiLanguage, typeof frFR>> = {
  fr: frFR,
  ar: arSA,
  pt: ptBR,
};

export function Providers({ children, initialUiLanguage }: ProvidersProps) {
  const queryClient = getQueryClient();
  const hydrateUiLanguage = useUiLanguageStore((s) => s.hydrate);
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const hydrated = useUiLanguageStore((s) => s._hydrated);
  const activeUiLanguage = hydrated ? uiLanguage : initialUiLanguage;

  useEffect(() => {
    hydrateUiLanguage(initialUiLanguage);
  }, [hydrateUiLanguage, initialUiLanguage]);

  useEffect(() => {
    document.documentElement.lang = activeUiLanguage;
    document.documentElement.dir = isRtlLanguage(activeUiLanguage) ? "rtl" : "ltr";
  }, [activeUiLanguage]);

  useEffect(() => {
    if (i18n.language !== activeUiLanguage) {
      i18n.changeLanguage(activeUiLanguage).catch(() => {});
    }
  }, [activeUiLanguage]);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => applyTheme(getStoredTheme());

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  return (
    <PostHogProvider>
      <ClerkProvider localization={CLERK_LOCALIZATIONS[activeUiLanguage]}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="bottom-center" richColors closeButton />
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </I18nextProvider>
      </ClerkProvider>
    </PostHogProvider>
  );
}
