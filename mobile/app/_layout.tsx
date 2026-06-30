import { BrandSplash } from "@/components/brand-splash";
import { ErrorBoundary } from "@/components/error-boundary";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analytics, posthogClient } from "@/lib/analytics";
import { queryClient } from "@/lib/api";
import { tokenCache } from "@/lib/auth";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useWidgetSync } from "@/lib/hooks/use-widget-sync";
import "@/lib/i18n";
import {
  addNotificationListener,
  addNotificationTapListener,
  configurePushNotifications,
  registerPushToken,
} from "@/lib/push-notifications";
import { useLanguageStore } from "@/store/language-store";
import { useNotificationStore } from "@/store/notification-store";
import { useOverlayStore } from "@/store/overlay-store";
import { useThemeStore } from "@/store/theme-store";
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { DarkTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { PostHogProvider } from "posthog-react-native";
import { Stack, useGlobalSearchParams, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { InteractionManager, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const prevSignedIn = useRef<boolean | undefined>(undefined);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const deletionPending = useSyncUser();

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
    if (!isLoaded) return;

    const wasSignedIn = prevSignedIn.current;
    prevSignedIn.current = isSignedIn;

    if (wasSignedIn !== undefined && wasSignedIn !== isSignedIn) {
      queryClient.clear();
    }

    const seg0 = (segments as readonly string[])[0];
    const inAuthGroup = seg0 === "(auth)";
    const inDeepRoute = !!seg0 && seg0 !== "(auth)";

    if (!isSignedIn) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in");
      return;
    }

    if (deletionPending || seg0 === "restore-account") return;

    if (inAuthGroup || !inDeepRoute) {
      router.replace("/(tabs)/learn");
    }
  }, [isSignedIn, isLoaded, segments, router, deletionPending]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useWidgetSync();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateUiLanguage = useUiLanguageStore((s) => s.hydrate);
  const hydrateTours = useTourStore((s) => s.hydrate);
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
    analytics.appOpen();
  }, [hydrateTheme, hydrateLanguage, hydrateUiLanguage, hydrateTours]);

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
        <QueryClientProvider client={queryClient}>
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
                  <Stack.Screen name="admin/broadcast" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/culture-content" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/daily-content" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/streak-tools" options={{ headerShown: false }} />
                </Stack>
                <StreakCelebrationHost />
              </GestureHandlerRootView>
              </PostHogProvider>
              <StatusBar style="light" />
            </AuthGate>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </ErrorBoundary>
    {!brandSplashDone && <BrandSplash onFinish={() => setBrandSplashDone(true)} />}
    </>
  );
}
