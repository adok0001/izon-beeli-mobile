import { ONBOARDING_KEY } from "@/lib/constants";
import { AudioPlayer } from "@/components/audio/audio-player";
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { GlobalSpeedDialFab } from "@/components/global-speed-dial-fab";
import { HapticTab } from "@/components/haptic-tab";
import { AnimatedTabIcon } from "@/components/ui/animated-tab-icon";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useDailyReminder } from "@/lib/hooks/use-daily-reminder";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useSyncUser } from "@/lib/hooks/use-sync-user";
import { useAudioStore } from "@/store/audio-store";
import { useGuestStore } from "@/store/guest-store";
import { useLanguageStore } from "@/store/language-store";
import { useNotificationStore } from "@/store/notification-store";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useAuth } from "@clerk/clerk-expo";
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
  const { isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestHydrated = useGuestStore((s) => s._hydrated);
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();
  useSyncUser();
  useDailyReminder(selectedLanguageId, summary?.streak ?? 0, currentUser?.dailyGoal);

  const hydrateNotifications = useNotificationStore((s) => s.hydrate);
  const hydrateChecklist = useWelcomeChecklistStore((s) => s.hydrate);
  const onboardingChecked = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    hydrateNotifications();
    hydrateChecklist();
  }, [hydrateNotifications, hydrateChecklist]);

  // One-time onboarding gate. Signed-in users are gated on the per-user backend
  // flag (survives device changes); guests have no backend user row yet, so they
  // fall back to the device-local flag.
  useEffect(() => {
    if (onboardingChecked.current) return;

    if (isGuest) {
      if (!guestHydrated) return;
      onboardingChecked.current = true;
      AsyncStorage.getItem(ONBOARDING_KEY)
        .then((val) => {
          if (!val) router.replace("/(onboarding)");
        })
        .catch(() => {});
      return;
    }

    if (!isSignedIn || currentUserLoading) return;
    onboardingChecked.current = true;
    if (currentUser && !currentUser.onboardingCompletedAt) {
      router.replace("/(onboarding)");
    }
  }, [isGuest, guestHydrated, isSignedIn, currentUserLoading, currentUser, router]);

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
      <GlobalSpeedDialFab />
    </>
  );
}
