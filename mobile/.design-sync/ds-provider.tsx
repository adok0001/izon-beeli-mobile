// Preview provider for the Claude Design sync. Wraps every preview card in a
// QueryClient seeded with representative content, so the app's data-connected
// cards (WordOfTheDay, ProverbOfTheDay, UpNextCard, …) render real-looking data
// instead of a loading/error state — WITHOUT stubbing their hooks (the bundle
// still ships the real fetch code). Auth/i18n/router/native are shimmed at
// bundle time (see .design-sync/overrides/bundle.mjs). Wired via cfg.provider.
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { Animated } from "react-native";
import { useThemeStore } from "@/store/theme-store";
import { en } from "@/lib/locales/en";

// react-native-web injects an empty <style id="react-native-stylesheet"> (its
// rules live in the CSSOM, so innerHTML stays empty). The design-sync render
// check treats the first element matching `#root, [id^="r"]` as the mount root —
// that empty style tag matches `[id^="r"]` and reads as "root empty" even though
// the real content renders in the #r0/#r1 cells. Rename it (CSSOM rules are
// unaffected) so the check measures the real content root.
if (typeof document !== "undefined") {
  const fixRnwStyle = () => {
    const s = document.getElementById("react-native-stylesheet");
    if (s) { s.id = "ds-rnw-styles"; return true; }
    return false;
  };
  if (!fixRnwStyle()) {
    const obs = new MutationObserver(() => { if (fixRnwStyle()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
}

// The Museum system is dark-first ("the foyer"); headless Chromium defaults to
// light, so pin the signature dark mode for every preview card.
useThemeStore.setState({ preference: "dark" });

// Settle entrance animations instantly so static screenshots capture the final
// state (cards that fade in via Animated.timing would otherwise shoot at opacity 0).
const instant = (value: any, config: any) => ({
  start: (cb?: (r: { finished: boolean }) => void) => { try { value.setValue(config.toValue); } catch {} cb && cb({ finished: true }); },
  stop() {}, reset() {},
});
(Animated as any).timing = instant;
(Animated as any).spring = instant;
(Animated as any).decay = instant;

// Initialize the default i18next instance with the app's real English bundle so
// components render authentic copy (useTranslation reads this global instance).
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    compatibilityJSON: "v4", lng: "en", fallbackLng: "en",
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false }, react: { useSuspense: false },
  });
}

// The single languageId every data-card preview is authored against.
export const PREVIEW_LANG = "izon";

const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
  },
});

// Seed the exact query keys the app's hooks read (see lib/hooks/*). Filled in
// as data-card previews are authored.
function seed() {
  const L = PREVIEW_LANG;
  // ["wotd", languageId] → { entry: DictionaryEntry }
  client.setQueryData(["wotd", L], {
    entry: {
      id: "wotd-1", word: "Tubo", english: "house, home", translations: { en: "house, home", fr: "maison" },
      category: "noun", languageId: L, pronunciation: "/tu.bo/", example: "Tubo ye dou.", exampleTranslation: "The house is big.",
    },
  });
  // ["proverbs", languageId] → Proverb[]
  client.setQueryData(["proverbs", L], [
    {
      id: "p1", languageId: L,
      text: "Beni mienge, beni saramu.",
      translation: { en: "Still water runs deep.", fr: "L'eau calme est profonde." },
      meaning: { en: "Quiet people often have the most depth.", fr: "Les gens calmes ont souvent le plus de profondeur." },
      literal: "Calm water, strong current",
    },
  ]);
  // ["progress","next-lesson", languageId] → NextLessonResponse
  client.setQueryData(["progress", "next-lesson", L], {
    lesson: { id: "l12", title: "Greetings & introductions", description: "Learn to greet elders and introduce yourself.", duration: 360, courseId: "c1" },
    course: { id: "c1", title: "Everyday Izon" },
    overallProgress: { completed: 5, total: 12 },
  });
  // ["daily-challenges","today"] → DailyChallenge[]
  const today = "2026-06-26";
  client.setQueryData(["daily-challenges", "today"], [
    { id: "ch1", userId: "u1", date: today, challengeType: "lesson", title: "Finish a lesson", description: "Complete one lesson today.", target: 1, progress: 1, completed: true, xpReward: 20, completedAt: today, createdAt: today },
    { id: "ch2", userId: "u1", date: today, challengeType: "wordbank", title: "Save 3 new words", description: "Add three words to your word bank.", target: 3, progress: 1, completed: false, xpReward: 15, completedAt: null, createdAt: today },
  ]);
  // ["contributors", null] → ContributorProfile[] (card calls useContributors() with no language)
  client.setQueryData(["contributors", null], [
    { id: "u9", name: "Ebiere Okara", approvedCount: 142, audioCount: 38, badges: [] },
    { id: "u8", name: "Tari Diri", approvedCount: 87, audioCount: 12, badges: [] },
  ]);
}
seed();

export function DesignSyncProvider({ children }: { children?: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
