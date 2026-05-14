import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOBILE_TOUR_REGISTRY } from "@/lib/tours/mobile-tour-registry";
import { useTourStore } from "@/store/tour-store";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FeatureItem {
  icon: string;
  color: string;
  bgColor: string;
  titleKey: string;
  detailKey: string;
}

const resolveText = (
  t: (key: string) => string,
  key: string
) => {
  return t(key);
};

function FeatureCard({ item, t }: Readonly<{ item: FeatureItem; t: (key: string) => string }>) {
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
          {resolveText(t, item.titleKey)}
        </Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {resolveText(t, item.detailKey)}
        </Text>
      </View>
    </View>
  );
}

export function FeatureTourModal() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any) as string;

  if (!activeTour) return null;

  const config = MOBILE_TOUR_REGISTRY[activeTour];
  if (!config) return null;

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
              {resolveText(tr, config.titleKey)}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400 text-center">
              {resolveText(tr, config.subtitleKey)}
            </Text>
          </View>

          {/* Feature cards */}
          <View className="px-6 gap-3">
            {config.features.map((f, index) => (
              <FeatureCard key={`${f.titleKey}-${index}`} item={f} t={tr} />
            ))}
          </View>

          <View className="mx-6 mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
            <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {t("onboarding.floatingChecklistTitle")}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-blue-700/90 dark:text-blue-300/90">
              {t("onboarding.floatingChecklistDetail")}
            </Text>
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
