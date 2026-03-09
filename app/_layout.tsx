import "../global.css";

import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { tokenCache } from "@/lib/auth";
import { queryClient } from "@/lib/api";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useThemeStore } from "@/store/theme-store";
import { useLanguageStore } from "@/store/language-store";
import { analytics } from "@/lib/analytics";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Reacts to auth state changes: clears cache, syncs user, and redirects. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const prevSignedIn = useRef<boolean | undefined>(undefined);

  // Sync Clerk user to backend DB
  useSyncUser();

  useEffect(() => {
    if (!isLoaded) return;

    const wasSignedIn = prevSignedIn.current;
    prevSignedIn.current = isSignedIn;

    // On auth change, clear stale data from the previous session
    if (wasSignedIn !== undefined && wasSignedIn !== isSignedIn) {
      queryClient.clear();
    }

    // Redirect based on auth state
    const inAuthGroup = segments[0] === "(auth)";
    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/learn");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s._hydrated);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTheme();
    hydrateLanguage();
    analytics.appOpen();
  }, []);

  if (!clerkPublishableKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables"
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
                name="(onboarding)"
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
            </Stack>
            <StatusBar style="auto" />
            </AuthGate>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
