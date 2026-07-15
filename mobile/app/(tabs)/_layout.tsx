import { ONBOARDING_KEY } from "@/lib/constants";
import { AudioPlayer } from "@/components/audio/audio-player";
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { GlobalSpeedDialFab } from "@/components/global-speed-dial-fab";
import { HapticTab } from "@/components/haptic-tab";
import { AnimatedTabIcon } from "@/components/ui/animated-tab-icon";
import { WelcomeChecklistFab } from "@/components/welcome-checklist-fab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useDailyReminder } from "@/lib/hooks/use-daily-reminder";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useAudioStore } from "@/store/audio-store";
import { useLanguageStore } from "@/store/language-store";
import { useNotificationStore } from "@/store/notification-store";
import { useTourStore } from "@/store/tour-store";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

function MiniPlayerTabBar(props: BottomTabBarProps) {
  const { currentTrackId, currentTrackRoute } = useAudioStore();
  const router = useRouter();
  const activeTabName = props.state.routes[props.state.index]?.name;
  const isEducatorTab = activeTabName === "educator" || activeTabName === "admin";

  return (
    <View>
      {currentTrackId && !isEducatorTab ? (
        <AudioPlayer
          compact
          onPress={currentTrackRoute ? () => router.push(currentTrackRoute as Parameters<typeof router.push>[0]) : undefined}
        />
      ) : null}
      <BottomTabBar {...props} />
    </View>
  );
}

type TabIconProps = Readonly<{ color: string; focused: boolean }>;

function LearnTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="book.fill" color={color} focused={focused} />;
}

function ExploreTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="sparkles" color={color} focused={focused} />;
}

function FeedTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="newspaper.fill" color={color} focused={focused} />;
}

function EducatorTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="shield.fill" color={color} focused={focused} />;
}

function AdminTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="gearshape.fill" color={color} focused={focused} />;
}

function ProfileTabIcon({ color, focused }: TabIconProps) {
  return <AnimatedTabIcon name="person.fill" color={color} focused={focused} />;
}

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { data: currentUser } = useCurrentUser();
  useSyncUser();
  useDailyReminder(selectedLanguageId, summary?.streak ?? 0, currentUser?.dailyGoal);

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
        tabBar={(props) => <MiniPlayerTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: "#C4862A",
          tabBarInactiveTintColor: "#4A4D60",
          tabBarStyle: {
            backgroundColor: "#0D0F1A",
            borderTopColor: "#2E3245",
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.5,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="learn"
          options={{
            title: t("tabs.learn"),
            tabBarIcon: LearnTabIcon,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t("tabs.explore"),
            tabBarIcon: ExploreTabIcon,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: t("tabs.feed"),
            tabBarIcon: FeedTabIcon,
          }}
        />
        <Tabs.Screen
          name="educator"
          options={{
            title: t("educator.panelTitle"),
            href:
              currentUser &&
              !currentUser.isAdmin &&
              canAccessEducatorPanel(currentUser)
                ? undefined
                : null,
            tabBarIcon: EducatorTabIcon,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: t("educator.adminPanel"),
            href: currentUser?.isAdmin ? undefined : null,
            tabBarIcon: AdminTabIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ProfileTabIcon,
          }}
        />
      </Tabs>
      <FeatureTourModal />
      <WelcomeChecklistFab />
      <GlobalSpeedDialFab />
    </>
  );
}
