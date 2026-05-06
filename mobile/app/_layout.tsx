import "@/lib/i18n";
import "react-native-reanimated";
import "../global.css";

import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { analytics } from "@/lib/analytics";
import { queryClient } from "@/lib/api";
import { tokenCache } from "@/lib/auth";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import {
    addNotificationListener,
    configurePushNotifications,
    registerPushToken,
} from "@/lib/push-notifications";
import { useLanguageStore } from "@/store/language-store";
import { useNotificationStore } from "@/store/notification-store";
import { useThemeStore } from "@/store/theme-store";
import { useTourStore } from "@/store/tour-store";
import { useUiLanguageStore } from "@/store/ui-language-store";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Reacts to auth state changes: clears cache, syncs user, and redirects. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const prevSignedIn = useRef<boolean | undefined>(undefined);
  const addNotification = useNotificationStore((s) => s.addNotification);

  // Sync Clerk user to backend DB; returns non-null when account is pending deletion
  const deletionPending = useSyncUser();

  // Redirect to restore screen when account is scheduled for deletion
  useEffect(() => {
    if (deletionPending) {
      router.replace({
        pathname: "/restore-account",
        params: { restoreBy: deletionPending.restoreBy },
      });
    }
  }, [deletionPending, router]);

  // Register push token when user signs in
  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then((token) => {
      if (token) registerPushToken(token).catch(() => {});
    });
  }, [isSignedIn]);

  // Listen for foreground push notifications (no-op in Expo Go)
  useEffect(() => {
    return addNotificationListener((title, body, type) => {
      addNotification(type as any, title, body);
    });
  }, [addNotification]);

  useEffect(() => {
    if (!isLoaded) return;

    const wasSignedIn = prevSignedIn.current;
    prevSignedIn.current = isSignedIn;

    // On auth change, clear stale data from the previous session
    if (wasSignedIn !== undefined && wasSignedIn !== isSignedIn) {
      queryClient.clear();
    }

    // Cast away typed-routes narrowing so we can detect the root index
    // screen, where segments[0] is undefined at runtime.
    const seg0 = (segments as readonly string[])[0];
    const inAuthGroup = seg0 === "(auth)";
    const inDeepRoute = !!seg0 && seg0 !== "(auth)";

    if (!isSignedIn) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in");
      return;
    }

    // Don't redirect if the deletion-restore redirect is pending or active
    if (deletionPending || seg0 === "restore-account") return;

    // Signed in: redirect from auth screens OR the root index (seg0 is empty)
    if (inAuthGroup || !inDeepRoute) {
      router.replace("/(tabs)/learn");
    }
  }, [isSignedIn, isLoaded, segments, router, deletionPending]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateUiLanguage = useUiLanguageStore((s) => s.hydrate);
  const hydrateTours = useTourStore((s) => s.hydrate);

  useEffect(() => {
    configurePushNotifications();
    hydrateTheme();
    hydrateLanguage();
    hydrateUiLanguage();
    hydrateTours();
    analytics.appOpen();
  }, []);

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
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <AuthGate>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(auth)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="lesson/[id]"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="contribute"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="reviewer-application"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="contribute-lesson"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="contribute-bulk"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="settings"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="dictionary"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="word-review"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="my-contributions"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="review"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="quiz"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="matching-game"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="adinkra"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="geez-lesson"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="contributors"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="notifications"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="cultural/[languageId]"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="proverbs/[languageId]"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="story/[courseId]"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="classroom/index"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="classroom/[groupId]"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="classroom/create"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="classroom/assign"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="multiplayer"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="dashboard"
                options={{ headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="word/[id]"
                options={{ headerBackTitle: "Back" }}
              />
            </Stack>
            <StatusBar style="auto" />
            </AuthGate>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
