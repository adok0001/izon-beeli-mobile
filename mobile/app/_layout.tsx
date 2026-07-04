import { BrandSplash } from "@/components/brand-splash";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analytics, posthogClient } from "@/lib/analytics";
import { queryClient, queryPersister } from "@/lib/api";
import { tokenCache } from "@/lib/auth";
import { migrateGuestToAccount } from "@/lib/guest-migration";
import { getCachedKnownAccountIds, getKnownAccounts } from "@/lib/known-accounts";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useWidgetSync } from "@/lib/hooks/use-widget-sync";
import { startWriteQueueReplay } from "@/lib/write-queue";
import "@/lib/i18n";
import {
  addNotificationListener,
  addNotificationTapListener,
  configurePushNotifications,
  registerPushToken,
} from "@/lib/push-notifications";
import { useDownloadsStore } from "@/store/downloads-store";
import { useGuestProgressStore } from "@/store/guest-progress-store";
import { useGuestStore } from "@/store/guest-store";
import { useLanguageStore } from "@/store/language-store";
import { useContentStore } from "@/store/content-store";
import { useNotificationStore } from "@/store/notification-store";
import { useOverlayStore } from "@/store/overlay-store";
import { useThemeStore } from "@/store/theme-store";
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useWriteQueueStore } from "@/store/write-queue-store";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { DarkTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PostHogProvider } from "posthog-react-native";
import { Stack, useGlobalSearchParams, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { InteractionManager, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import "react-native-reanimated";
import "../global.css";

void SplashScreen.preventAutoHideAsync().catch(() => {});
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const unstable_settings = {
  anchor: "(tabs)",
};

// Navigation chrome (headers, tab bar) is always dark — the museum foyer is always atmospheric.
// Content areas adapt via useMuseumTheme().
const MuseumNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#C4862A",
    background: "#0D0F1A",
    card: "#0D0F1A",       // tab bar + header background
    text: "#F7F2E8",       // header title + tab label
    border: "#2E3245",
    notification: "#C4862A",
  },
};
/**
 * App-level host for the streak milestone celebration. The modal is mounted once,
 * above every screen, and only surfaces the queued milestone when no screen or
 * overlay is holding the foreground — so it stacks behind the learner's current
 * screen instead of overtaking it.
 */
function StreakCelebrationHost() {
  const pendingStreak = useOverlayStore((s) => s.pendingStreak);
  const busy = useOverlayStore((s) => s.claims.length > 0);
  const dismissStreak = useOverlayStore((s) => s.dismissStreak);
  const [ready, setReady] = useState(false);

  // The foreground clears the instant the learner leaves the screen — but that
  // leave is usually a navigation transition, and a full-screen <Modal> shown
  // mid-transition gets swallowed by RN. Wait for interactions to settle so the
  // celebration reliably presents on the screen they land on.
  const queued = !!pendingStreak && !busy;
  useEffect(() => {
    if (!queued) {
      setReady(false);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, [queued]);

  return (
    <StreakCelebrationModal
      visible={queued && ready}
      streak={pendingStreak?.streak ?? 0}
      isMilestone={pendingStreak?.isMilestone}
      onDismiss={dismissStreak}
    />
  );
}

/**
 * Buster is keyed to identity (signed-in user id, or "guest") so switching
 * accounts on the same device discards the previous identity's persisted
 * cache instead of briefly showing stale data from someone else.
 */
function PersistedQueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const buster = userId ?? (isGuest ? "guest" : "anonymous");

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        buster,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const prevSignedIn = useRef<boolean | undefined>(undefined);
  const migratingGuestRef = useRef(false);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestHydrated = useGuestStore((s) => s._hydrated);
  // Tracks only whether the SecureStore cache has ever been hydrated this
  // session, not the account list itself — the redirect effect below reads
  // the list synchronously via getCachedKnownAccountIds() at decision time,
  // so a same-session sign-out (which upserts into the cache right before
  // calling Clerk's signOut) is never missed by stale state.
  const [knownAccountsBooted, setKnownAccountsBooted] = useState(false);

  const deletionPending = useSyncUser();

  useEffect(() => {
    getKnownAccounts().then(() => setKnownAccountsBooted(true));
  }, []);

  useEffect(() => {
    if (deletionPending) {
      router.replace({
        pathname: "/restore-account",
        params: { restoreBy: deletionPending.restoreBy },
      });
    }
  }, [deletionPending, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then((token) => {
      if (token) registerPushToken(token).catch(() => {});
    });
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isSignedIn && userId) analytics.identify(userId);
  }, [isSignedIn, userId]);

  // Drains any progress/wordbank writes queued while offline, replaying
  // immediately if already online and again on every reconnect.
  useEffect(() => {
    if (!isSignedIn) return;
    return startWriteQueueReplay(getToken);
  }, [isSignedIn, getToken]);

  // A guest who signs in still has isGuest=true until migration finishes, so
  // this naturally retries on every reconnect alongside the write-queue
  // replay above until the local progress has fully landed on the account.
  useEffect(() => {
    if (!isSignedIn || !isGuest || !guestHydrated) return;

    const attemptMigration = async () => {
      if (migratingGuestRef.current) return;
      migratingGuestRef.current = true;
      try {
        const migrated = await migrateGuestToAccount(getToken);
        if (migrated) {
          addNotification(
            "achievement",
            t("auth.guestMigrationTitle"),
            t("auth.guestMigrationBody")
          );
        }
      } finally {
        migratingGuestRef.current = false;
      }
    };

    attemptMigration();
    return onlineManager.subscribe((online) => {
      if (online) attemptMigration();
    });
  }, [isSignedIn, isGuest, guestHydrated, getToken, addNotification, t]);

  useEffect(() => {
    return addNotificationTapListener((route) => {
      router.push(route as never);
    });
  }, [router]);

  useEffect(() => {
    return addNotificationListener((title, body, type, icon) => {
      const VALID_TYPES = ["word_of_day", "proverb_of_month", "song_of_week", "streak_reminder", "assignment_due", "achievement", "broadcast", "reengagement"] as const;
      const safeType = VALID_TYPES.includes(type as any) ? (type as typeof VALID_TYPES[number]) : "broadcast";
      addNotification(safeType, title, body, icon);
    });
  }, [addNotification]);

  useEffect(() => {
    if (!isLoaded || !guestHydrated) return;

    const wasSignedIn = prevSignedIn.current;
    prevSignedIn.current = isSignedIn;

    if (wasSignedIn !== undefined && wasSignedIn !== isSignedIn) {
      queryClient.clear();
    }

    const seg0 = (segments as readonly string[])[0];
    const inAuthGroup = seg0 === "(auth)";
    const inDeepRoute = !!seg0 && seg0 !== "(auth)";
    const allowed = isSignedIn || isGuest;

    if (!allowed) {
      // Wait for the known-accounts cache to hydrate before choosing where to
      // send a signed-out user, so this never flashes straight to sign-in
      // first. Read synchronously (not from React state) so a same-session
      // sign-out — which upserts into the cache right before calling Clerk's
      // signOut — is reflected immediately, not one render behind.
      if (!knownAccountsBooted) return;
      if (!inAuthGroup) {
        const knownAccountIds = getCachedKnownAccountIds() ?? [];
        router.replace(knownAccountIds.length > 0 ? "/(auth)/sign-back-in" : "/(auth)/sign-in");
      }
      return;
    }

    if (isSignedIn && (deletionPending || seg0 === "restore-account")) return;

    if (inAuthGroup || !inDeepRoute) {
      router.replace("/(tabs)/learn");
    }
  }, [isSignedIn, isLoaded, isGuest, guestHydrated, knownAccountsBooted, segments, router, deletionPending]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useWidgetSync();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateUiLanguage = useUiLanguageStore((s) => s.hydrate);
  const hydrateTours = useTourStore((s) => s.hydrate);
  const hydrateGuest = useGuestStore((s) => s.hydrate);
  const hydrateGuestProgress = useGuestProgressStore((s) => s.hydrate);
  const hydrateWriteQueue = useWriteQueueStore((s) => s.hydrate);
  const hydrateDownloads = useDownloadsStore((s) => s.hydrate);
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const enrolledLanguageIds = useLanguageStore((s) => s.enrolledLanguageIds);
  const hydrateContent = useContentStore((s) => s.hydrate);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_600SemiBold,
    Akagu: require("../assets/fonts/Akagu.ttf"),
   });

  const [brandSplashDone, setBrandSplashDone] = useState(false);

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthogClient.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  useEffect(() => {
    configurePushNotifications();
    hydrateTheme();
    hydrateLanguage();
    hydrateUiLanguage();
    hydrateTours();
    hydrateGuest();
    hydrateGuestProgress();
    hydrateWriteQueue();
    hydrateDownloads();
    analytics.appOpen();
  }, [
    hydrateTheme,
    hydrateLanguage,
    hydrateUiLanguage,
    hydrateTours,
    hydrateGuest,
    hydrateGuestProgress,
    hydrateWriteQueue,
    hydrateDownloads,
  ]);

  // Offline/guest content snapshot (dictionary, sentences, proverbs, cultural,
  // scripts, interactive stories) — re-hydrates whenever the active language
  // changes, including the first (default) value before language-store's own
  // async hydrate() resolves. Every enrolled language is hydrated too (not just
  // the selected one) so the profile résumé can resolve completed lessons from
  // any language the learner has studied, not only the one currently active.
  useEffect(() => {
    if (selectedLanguageId) hydrateContent(selectedLanguageId);
    for (const id of enrolledLanguageIds) hydrateContent(id);
  }, [selectedLanguageId, enrolledLanguageIds, hydrateContent]);

  // The native splash is hidden by <BrandSplash> on its first layout (not here),
  // so the ink overlay is already covering the screen when the native splash
  // lifts — otherwise the white root view flashes for a frame in the handoff.
  if (!fontsLoaded && !fontError) return null;

  if (!clerkPublishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-base font-semibold text-red-500">
          Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.{"\n"}Check your EAS build profile environment variables.
        </Text>
      </View>
    );
  }

  return (
    <>
    <ErrorBoundary>
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <PersistedQueryProvider>
          <ThemeProvider value={MuseumNavigationTheme}>
            <AuthGate>
              <PostHogProvider
                client={posthogClient}
                autocapture={{
                  captureScreens: false,
                  captureTouches: true,
                  propsToCapture: ["testID"],
                }}
              >
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: "#0D0F1A" },
                    headerTintColor: "#F7F2E8",
                    headerTitleStyle: { color: "#F7F2E8", fontWeight: "700" },
                    headerShadowVisible: false,
                    // Inherited by every screen so the iOS back button never falls
                    // back to the previous route name (e.g. "(tabs)"). Per-screen
                    // overrides below are now redundant but harmless.
                    headerBackTitle: "Back",
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)/index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: "Back" }} />
                  <Stack.Screen name="lesson/[id]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="contribute" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="reviewer-application" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="educator-guide" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="contribute-lesson" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="contribute-bulk" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="dictionary" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="word-review" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="my-contributions" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="downloads" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="review" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="quiz" options={{ presentation: "modal", headerShown: true }} />
                  <Stack.Screen name="matching-game" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="adinkra" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="geez-lesson" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="nsibidi-lesson" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="contributors" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="notifications" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="cultural/[languageId]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="proverbs/[languageId]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="story/[courseId]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="classroom/index" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="classroom/[groupId]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="classroom/create" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="classroom/assign" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="multiplayer" options={{ headerShown: false }} />
                  <Stack.Screen name="dashboard" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="bounties" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="bounty-create" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="bounty-edit" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="word/[id]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="discover-story/[id]" options={{ headerShown: false, animation: "fade" }} />
                  <Stack.Screen name="discover-content/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
                  <Stack.Screen name="speed-round" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="recall-bingo" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="dictation" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="say-it-back" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="fill-proverb" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="sentence-builder" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="script-decode" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="trace-symbol" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="etymology-trail" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="word-challenge" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="journal" options={{ headerShown: false }} />
                  <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
                  <Stack.Screen name="playground" options={{ headerShown: false }} />
                  <Stack.Screen name="today" options={{ headerShown: false }} />
                  <Stack.Screen name="explore/[type]" options={{ headerShown: false }} />
                  <Stack.Screen name="songs/[languageId]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="account" options={{ headerShown: false }} />
                  <Stack.Screen name="plus-paywall" options={{ headerShown: false }} />
                  <Stack.Screen name="practice-review" options={{ headerShown: false }} />
                  <Stack.Screen name="restore-account" options={{ headerShown: false }} />
                  <Stack.Screen name="admin" options={{ headerShown: false }} />
                </Stack>
                <StreakCelebrationHost />
              </GestureHandlerRootView>
              </PostHogProvider>
              <StatusBar style="light" />
            </AuthGate>
          </ThemeProvider>
        </PersistedQueryProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </ErrorBoundary>
    {!brandSplashDone && <BrandSplash onFinish={() => setBrandSplashDone(true)} />}
    </>
  );
}
