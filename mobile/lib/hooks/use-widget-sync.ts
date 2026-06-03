import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { apiFetch } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";

// Lazy-load the native module so the app still works before a native build
function getWidgetModule() {
  try {
    return require("../../modules/beeli-widget/src") as typeof import("../../modules/beeli-widget/src");
  } catch {
    return null;
  }
}

async function syncWidgets(languageId: string) {
  const mod = getWidgetModule();
  if (!mod) return;

  const encoded = encodeURIComponent(languageId);

  const [wotd, potm, sotw] = await Promise.allSettled([
    apiFetch<{ entry: { word: string; pronunciation?: string; english: string } | null }>(`/daily-content/wotd?languageId=${encoded}`),
    apiFetch<{ proverb: { text: string; translation: string } | null }>(`/daily-content/potm?languageId=${encoded}`),
    apiFetch<{ lesson: { title: string } | null }>(`/daily-content/sotw?languageId=${encoded}`),
  ]);

  if (wotd.status === "fulfilled" && wotd.value.entry) {
    mod.writeWotd({ ...wotd.value.entry, languageId });
  }
  if (potm.status === "fulfilled" && potm.value.proverb) {
    mod.writePotm({ ...potm.value.proverb, languageId });
  }
  if (sotw.status === "fulfilled" && sotw.value.lesson) {
    mod.writeSotw({ title: sotw.value.lesson.title, languageId });
  }

  mod.reloadWidgetTimelines();
}

export function useWidgetSync() {
  const languageId = useLanguageStore((s) => s.selectedLanguageId);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    // Widgets only exist on iOS and Android
    if (Platform.OS === "web") return;
    if (!languageId) return;

    // Sync immediately on mount
    syncWidgets(languageId).catch(() => {});
    lastSynced.current = languageId;

    const handler = (state: AppStateStatus) => {
      if (state === "active") {
        syncWidgets(languageId).catch(() => {});
      }
    };

    const sub = AppState.addEventListener("change", handler);
    return () => sub.remove();
  }, [languageId]);
}
