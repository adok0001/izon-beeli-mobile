import { ONBOARDING_KEY } from "@/app/(onboarding)/index";
import { AudioPlayer } from "@/components/audio/audio-player";
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WelcomeChecklistFab } from "@/components/welcome-checklist-fab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDailyReminder } from "@/lib/hooks/use-daily-reminder";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useNotificationStore } from "@/store/notification-store";
import { useTourStore } from "@/store/tour-store";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

function TabBarWithPlayer(props: Readonly<BottomTabBarProps>) {
  const { currentTrackId } = useAudioStore();

  return (
    <View>
      {currentTrackId && <AudioPlayer compact />}
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  useSyncUser();
  useDailyReminder(selectedLanguageId, summary?.streak ?? 0);

  const hydrateNotifications = useNotificationStore((s) => s.hydrate);
  const hydrateChecklist = useWelcomeChecklistStore((s) => s.hydrate);
  const hasSeenWelcome = useTourStore((s) => s.hasSeen("welcome"));
  const activeTour = useTourStore((s) => s.activeTour);
  const startWelcomeTour = useTourStore((s) => s.start);
  const toursHydrated = useTourStore((s) => s._hydrated);
  const onboardingChecked = useRef(false);
  const welcomeChecked = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    hydrateNotifications();
    hydrateChecklist();
  }, [hydrateNotifications, hydrateChecklist]);

  // One-time onboarding gate: redirect to onboarding if not yet completed
  useEffect(() => {
    if (onboardingChecked.current) return;
    onboardingChecked.current = true;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) router.replace("/(onboarding)");
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!toursHydrated || welcomeChecked.current || activeTour || hasSeenWelcome) return;

    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => {
        if (!val || welcomeChecked.current) return;
        welcomeChecked.current = true;
        startWelcomeTour();
      })
      .catch(() => {});
  }, [activeTour, hasSeenWelcome, startWelcomeTour, toursHydrated]);

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBarWithPlayer {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="learn"
          options={{
            title: t("tabs.learn"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="book.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="listen"
          options={{
            title: t("tabs.practice"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="sparkles" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: t("tabs.journal"),
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="pencil.and.list.clipboard"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: t("tabs.feed"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="newspaper.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
      <FeatureTourModal />
      <WelcomeChecklistFab />
    </>
  );
}
