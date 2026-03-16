"use client";

import i18n from "@/lib/i18n";
import { getQueryClient } from "@/lib/query-client";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import type { UiLanguage } from "@/lib/ui-language";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { frFR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
  initialUiLanguage: UiLanguage;
}>;

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
    <ClerkProvider localization={activeUiLanguage === "fr" ? frFR : undefined}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </I18nextProvider>
    </ClerkProvider>
  );
}
