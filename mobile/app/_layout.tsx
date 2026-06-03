import { ErrorBoundary } from "@/components/error-boundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analytics } from "@/lib/analytics";
import { queryClient } from "@/lib/api";
import { tokenCache } from "@/lib/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import "@/lib/i18n";
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
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import "react-native-reanimated";
import "../global.css";

void SplashScreen.preventAutoHideAsync().catch(() => {});
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const unstable_settings = {
  anchor: "(tabs)",
};
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
    return addNotificationListener((title, body, type, icon) => {
      const VALID_TYPES = ["word_of_day", "streak_reminder", "assignment_due", "achievement", "broadcast", "reengagement"] as const;
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
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateUiLanguage = useUiLanguageStore((s) => s.hydrate);
  const hydrateTours = useTourStore((s) => s.hydrate);
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_700Bold, PlusJakartaSans_600SemiBold });

  useEffect(() => {
    configurePushNotifications();
    hydrateTheme();
    hydrateLanguage();
    hydrateUiLanguage();
    hydrateTours();
    analytics.appOpen();
  }, [hydrateTheme, hydrateLanguage, hydrateUiLanguage, hydrateTours]);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

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
    <ErrorBoundary>
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <AuthGate>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)/index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: "Back" }} />
                  <Stack.Screen name="lesson/[id]" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="contribute" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="reviewer-application" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="contribute-lesson" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="contribute-bulk" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="dictionary" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="word-review" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="my-contributions" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="review" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="quiz" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="matching-game" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="adinkra" options={{ headerBackTitle: "Back" }} />
                  <Stack.Screen name="geez-lesson" options={{ headerBackTitle: "Back" }} />
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
                </Stack>
              </GestureHandlerRootView>
              <StatusBar style="auto" />
            </AuthGate>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </ErrorBoundary>
  );
}
