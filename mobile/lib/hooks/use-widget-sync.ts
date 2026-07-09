import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { apiFetch } from "@/lib/api";
import { localize } from "@/lib/localize";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";

// Lazy-load the native module so the app still works before a native build
function getWidgetModule() {
  try {
    return require("../../modules/beeli-widget/src") as typeof import("../../modules/beeli-widget/src");
  } catch {
    return null;
  }
}

async function syncWidgets(languageId: string, uiLanguage: UiLanguage) {
  const mod = getWidgetModule();
  if (!mod) {
    console.warn("[WidgetSync] Native BeeliWidget module not available");
    return;
  }

  const encoded = encodeURIComponent(languageId);

  const [wotd, potm, sotw] = await Promise.allSettled([
    apiFetch<{ entry: { word: string; pronunciation?: string; english: string } | null }>(`/daily-content/wotd?languageId=${encoded}`),
    apiFetch<{ proverb: { text: string; translation: string } | null }>(`/daily-content/potm?languageId=${encoded}`),
    apiFetch<{ lesson: { title: string | LocalizedText } | null }>(`/daily-content/sotw?languageId=${encoded}`),
  ]);

  const nativeAvailable = mod.isNativeModuleLoaded?.() ?? false;
  console.warn("[WidgetSync] native module loaded:", nativeAvailable);

  let wrote = false;

  if (wotd.status === "fulfilled" && wotd.value.entry) {
    mod.writeWotd({ ...wotd.value.entry, languageId });
    wrote = true;
  } else if (wotd.status === "rejected") {
    console.warn("[WidgetSync] wotd fetch failed:", wotd.reason);
  } else if (wotd.status === "fulfilled" && !wotd.value.entry) {
    console.warn("[WidgetSync] wotd: no entry in DB for language", languageId);
  }

  if (potm.status === "fulfilled" && potm.value.proverb) {
    mod.writePotm({ ...potm.value.proverb, languageId });
    wrote = true;
  } else if (potm.status === "rejected") {
    console.warn("[WidgetSync] potm fetch failed:", potm.reason);
  } else if (potm.status === "fulfilled" && !potm.value.proverb) {
    console.warn("[WidgetSync] potm: no proverb in DB for language", languageId);
  }

  if (sotw.status === "fulfilled" && sotw.value.lesson) {
    mod.writeSotw({ title: localize(sotw.value.lesson.title, uiLanguage, "—"), languageId });
    wrote = true;
  } else if (sotw.status === "rejected") {
    console.warn("[WidgetSync] sotw fetch failed:", sotw.reason);
  } else if (sotw.status === "fulfilled" && !sotw.value.lesson) {
    console.warn("[WidgetSync] sotw: no song in DB for language", languageId);
  }

  if (wrote) {
    console.warn("[WidgetSync] wrote data, reloading timelines");
    mod.reloadWidgetTimelines();
  } else {
    console.warn("[WidgetSync] nothing written — all API results were null or failed");
  }
}

export function useWidgetSync() {
  const languageId = useLanguageStore((s) => s.selectedLanguageId);
  const uiLanguage = useUiLanguageStore((s) => s.uiLanguage);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    // Widgets only exist on iOS and Android
    if (Platform.OS === "web") return;
    if (!languageId) return;

    console.warn("[WidgetSync] starting sync for language:", languageId);
    // Sync immediately on mount
    syncWidgets(languageId, uiLanguage).catch((e) => console.warn("[WidgetSync] uncaught:", e));
    lastSynced.current = languageId;

    const handler = (state: AppStateStatus) => {
      if (state === "active") {
        syncWidgets(languageId, uiLanguage).catch(() => {});
      }
    };

    const sub = AppState.addEventListener("change", handler);
    return () => sub.remove();
  }, [languageId, uiLanguage]);
}
