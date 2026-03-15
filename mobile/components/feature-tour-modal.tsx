import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTourStore, type TourId } from "@/store/tour-store";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

interface FeatureItem {
  icon: string;
  color: string;
  bgColor: string;
  titleKey: string;
  detailKey: string;
}

interface TourConfig {
  heroIcon: string;
  heroColor: string;
  heroBg: string;
  titleKey: string;
  subtitleKey: string;
  features: FeatureItem[];
}

const TOUR_CONFIGS: Record<TourId, TourConfig> = {
  learn: {
    heroIcon: "book.fill",
    heroColor: "#3b82f6",
    heroBg: "#dbeafe",
    titleKey: "onboarding.learnTourTitle",
    subtitleKey: "onboarding.learnTourSubtitle",
    features: [
      {
        icon: "book.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.learnTourCourses",
        detailKey: "onboarding.learnTourCoursesDetail",
      },
      {
        icon: "speaker.wave.2.fill",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.learnTourAudio",
        detailKey: "onboarding.learnTourAudioDetail",
      },
      {
        icon: "chart.bar.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.learnTourProgress",
        detailKey: "onboarding.learnTourProgressDetail",
      },
    ],
  },
  practice: {
    heroIcon: "sparkles",
    heroColor: "#8b5cf6",
    heroBg: "#ede9fe",
    titleKey: "onboarding.practiceTourTitle",
    subtitleKey: "onboarding.practiceTourSubtitle",
    features: [
      {
        icon: "trophy.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.practiceTourQuiz",
        detailKey: "onboarding.practiceTourQuizDetail",
      },
      {
        icon: "rectangle.grid.2x2",
        color: "#8b5cf6",
        bgColor: "#ede9fe",
        titleKey: "onboarding.practiceTourMatching",
        detailKey: "onboarding.practiceTourMatchingDetail",
      },
      {
        icon: "flame.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.practiceTourDaily",
        detailKey: "onboarding.practiceTourDailyDetail",
      },
      {
        icon: "person.2.fill",
        color: "#ef4444",
        bgColor: "#fee2e2",
        titleKey: "onboarding.practiceTourMultiplayer",
        detailKey: "onboarding.practiceTourMultiplayerDetail",
      },
    ],
  },
  journal: {
    heroIcon: "pencil.and.list.clipboard",
    heroColor: "#3b82f6",
    heroBg: "#dbeafe",
    titleKey: "onboarding.journalTourTitle",
    subtitleKey: "onboarding.journalTourSubtitle",
    features: [
      {
        icon: "pencil.and.list.clipboard",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.journalTourWrite",
        detailKey: "onboarding.journalTourWriteDetail",
      },
      {
        icon: "clock.arrow.circlepath",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.journalTourRevisit",
        detailKey: "onboarding.journalTourRevisitDetail",
      },
    ],
  },
  feed: {
    heroIcon: "newspaper.fill",
    heroColor: "#8b5cf6",
    heroBg: "#ede9fe",
    titleKey: "onboarding.feedTourTitle",
    subtitleKey: "onboarding.feedTourSubtitle",
    features: [
      {
        icon: "newspaper.fill",
        color: "#8b5cf6",
        bgColor: "#ede9fe",
        titleKey: "onboarding.feedTourActivity",
        detailKey: "onboarding.feedTourActivityDetail",
      },
      {
        icon: "heart.fill",
        color: "#ef4444",
        bgColor: "#fee2e2",
        titleKey: "onboarding.feedTourInteract",
        detailKey: "onboarding.feedTourInteractDetail",
      },
      {
        icon: "mic.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.feedTourContribute",
        detailKey: "onboarding.feedTourContributeDetail",
      },
    ],
  },
  profile: {
    heroIcon: "person.fill",
    heroColor: "#10b981",
    heroBg: "#d1fae5",
    titleKey: "onboarding.profileTourTitle",
    subtitleKey: "onboarding.profileTourSubtitle",
    features: [
      {
        icon: "flame.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.profileTourStats",
        detailKey: "onboarding.profileTourStatsDetail",
      },
      {
        icon: "chart.bar.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.profileTourDashboard",
        detailKey: "onboarding.profileTourDashboardDetail",
      },
      {
        icon: "person.3.fill",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.profileTourClassroom",
        detailKey: "onboarding.profileTourClassroomDetail",
      },
      {
        icon: "star.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.profileTourBounties",
        detailKey: "onboarding.profileTourBountiesDetail",
      },
    ],
  },
};

function FeatureCard({ item, t }: { item: FeatureItem; t: (k: string) => string }) {
  return (
    <View className="flex-row items-start rounded-2xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <View
        className="mr-4 h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: item.bgColor }}
      >
        <IconSymbol name={item.icon as any} size={20} color={item.color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-neutral-900 dark:text-white">
          {t(item.titleKey)}
        </Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {t(item.detailKey)}
        </Text>
      </View>
    </View>
  );
}

export function FeatureTourModal() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();

  if (!activeTour) return null;

  const config = TOUR_CONFIGS[activeTour];

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismissTour}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        {/* Close button */}
        <View className="flex-row justify-end px-5 pt-3">
          <Pressable
            onPress={dismissTour}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <IconSymbol name="xmark" size={16} color="#9ca3af" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="items-center px-6 pt-4 pb-6">
            <View
              className="mb-5 h-20 w-20 items-center justify-center rounded-3xl"
              style={{ backgroundColor: config.heroBg }}
            >
              <IconSymbol name={config.heroIcon as any} size={36} color={config.heroColor} />
            </View>
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white text-center">
              {t(config.titleKey)}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400 text-center">
              {t(config.subtitleKey)}
            </Text>
          </View>

          {/* Feature cards */}
          <View className="px-6 gap-3">
            {config.features.map((f) => (
              <FeatureCard key={f.titleKey} item={f} t={t} />
            ))}
          </View>
        </ScrollView>

        {/* Got it button */}
        <View className="px-6 pb-6 pt-4">
          <Pressable
            onPress={dismissTour}
            className="items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">{t("onboarding.gotIt")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
