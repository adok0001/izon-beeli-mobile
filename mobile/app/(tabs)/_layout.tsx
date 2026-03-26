import { View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AudioPlayer } from "@/components/audio/audio-player";
import { useAudioStore } from "@/store/audio-store";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useNotificationStore } from "@/store/notification-store";
import { useDailyReminder } from "@/lib/hooks/use-daily-reminder";
import { useLanguageStore } from "@/store/language-store";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_KEY } from "@/app/(onboarding)/index";
import { useTranslation } from "react-i18next";
import { useTourStore } from "@/store/tour-store";
import { FeatureTourModal } from "@/components/feature-tour-modal";

function TabBarWithPlayer(props: BottomTabBarProps) {
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
  const onboardingChecked = useRef(false);
  const { t } = useTranslation();
  const { hydrate: hydrateTour, activeTour, start: startTour, hasSeen, _hydrated } = useTourStore();

  useEffect(() => {
    hydrateNotifications();
    hydrateTour();
  }, []);

  // One-time onboarding gate: redirect to onboarding if not yet completed
  useEffect(() => {
    if (onboardingChecked.current) return;
    onboardingChecked.current = true;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) router.replace("/(onboarding)");
    }).catch(() => {});
  }, []);

  // Auto-start feature tour for first-time users (after store is hydrated)
  useEffect(() => {
    if (!_hydrated || activeTour || hasSeen("profile")) return;
    const id = setTimeout(startTour, 800);
    return () => clearTimeout(id);
  }, [_hydrated]);

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
    </>
  );
}
