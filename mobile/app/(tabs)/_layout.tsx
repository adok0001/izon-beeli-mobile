import { ONBOARDING_KEY } from "@/app/(onboarding)/index";
import { AudioPlayer } from "@/components/audio/audio-player";
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
  const { currentTrackId } = useAudioStore();
  const router = useRouter();
  const activeTabName = props.state.routes[props.state.index]?.name;
  const isEducatorTab = activeTabName === "educator" || activeTabName === "admin";

  return (
    <View>
      {currentTrackId && !isEducatorTab ? (
        <AudioPlayer
          compact
          onPress={() => router.push(`/lesson/${currentTrackId}`)}
        />
      ) : null}
      <BottomTabBar {...props} />
    </View>
  );
}

function LearnTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="book.fill" color={color} />;
}

function ListenTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="sparkles" color={color} />;
}

function JournalTabIcon({ color }: Readonly<{ color: string }>) {
  return (
    <IconSymbol
      size={28}
      name="pencil.and.list.clipboard"
      color={color}
    />
  );
}

function FeedTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="newspaper.fill" color={color} />;
}

function EducatorTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="shield.fill" color={color} />;
}

function AdminTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="gearshape.fill" color={color} />;
}

function ProfileTabIcon({ color }: Readonly<{ color: string }>) {
  return <IconSymbol size={28} name="person.fill" color={color} />;
}

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { data: currentUser } = useCurrentUser();
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
        tabBar={(props) => <MiniPlayerTabBar {...props} />}
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
            tabBarIcon: LearnTabIcon,
          }}
        />
        <Tabs.Screen
          name="listen"
          options={{
            title: t("tabs.practice"),
            tabBarIcon: ListenTabIcon,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: t("tabs.journal"),
            tabBarIcon: JournalTabIcon,
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
    </>
  );
}
