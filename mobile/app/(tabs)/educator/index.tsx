import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    canAccessEducatorPanel,
    canManageBounties,
    useCurrentUser,
} from "@/lib/hooks/use-current-user";
import { useEducatorStats } from "@/lib/hooks/use-educator-panel";
import { getLanguageName } from "@/lib/mock-data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ONBOARDING_KEY = "educator_onboarded";

function StatCard({
  icon,
  label,
  value,
}: Readonly<{ icon: string; label: string; value: number }>) {
  return (
    <View className="min-w-[46%] flex-1 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <IconSymbol name={icon as never} size={20} color="#3b82f6" />
      <Text className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
        {value}
      </Text>
      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  detail,
  onPress,
}: Readonly<{
  icon: string;
  label: string;
  detail: string;
  onPress: () => void;
}>) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl bg-neutral-50 px-4 py-4 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-neutral-900">
        <IconSymbol name={icon as never} size={20} color="#3b82f6" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">
          {label}
        </Text>
        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {detail}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
    </Pressable>
  );
}

export default function EducatorPanelScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;
  const { data: educatorStats } = useEducatorStats(canAccess);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    if (!educatorStats) return;
    const isEmpty =
      educatorStats.dictionaryEntries === 0 &&
      educatorStats.pendingLessons === 0 &&
      educatorStats.approvedContributions === 0;
    if (!isEmpty) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val: string | null) => {
      if (!val) setOnboardingStep(1);
    }).catch(() => {});
  }, [educatorStats]);

  const dismissOnboarding = () => {
    setOnboardingStep(null);
    AsyncStorage.setItem(ONBOARDING_KEY, "done").catch(() => {});
  };

  if (!isLoading && !canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: t("educator.panelTitle") }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" edges={["top"]}>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <IconSymbol name="shield.fill" size={28} color="#9ca3af" />
          </View>
          <Text className="mt-4 px-8 text-center text-base font-semibold text-neutral-600 dark:text-neutral-400">
            {t("review.adminRequired")}
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/profile")}
            className="mt-6 rounded-2xl bg-neutral-100 px-6 py-3 active:opacity-80 dark:bg-neutral-800"
          >
            <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
              {t("common.goBack")}
            </Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }

  const languageNames = (currentUser?.reviewerLanguages ?? [])
    .map((languageId) => getLanguageName(languageId))
    .join(", ");
  const assignedLanguages = currentUser?.isAdmin
    ? t("educator.overview.scopeAdmin")
    : t("educator.overview.scopeLangs", {
        languages: languageNames || getLanguageName(currentUser?.selectedLanguageId),
      });
  const panelTitle = t("educator.panelTitle");

  return (
    <>
      <Stack.Screen options={{ title: panelTitle }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-5 pb-2 pt-4">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {panelTitle}
            </Text>
            <Text className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {currentUser
                ? t("educator.overview.welcome", { name: currentUser.name || t("profile.learner") })
                : t("common.loading")}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {assignedLanguages}
            </Text>
          </View>

          {/* First-time onboarding */}
          {onboardingStep != null && (
            <View className="mx-5 mt-4 overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-900/20">
              {/* Step indicator */}
              <View className="flex-row gap-1.5 px-4 pt-4">
                {([1, 2, 3] as const).map((s) => (
                  <View
                    key={s}
                    className={`h-1 flex-1 rounded-full ${
                      s <= onboardingStep ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-800"
                    }`}
                  />
                ))}
              </View>
              <Text className="px-4 pt-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                {t("educator.onboarding.stepOf", { step: onboardingStep, total: 3 })}
              </Text>

              {onboardingStep === 1 && (
                <View className="p-4">
                  <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <IconSymbol name="book.fill" size={20} color="#fff" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">
                    {t("educator.onboarding.step1Title")}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {t("educator.onboarding.step1Desc")}
                  </Text>
                  <Pressable
                    onPress={() => { router.push("/educator/courses" as any); setOnboardingStep(2); }}
                    className="mt-4 items-center rounded-xl bg-blue-500 py-3 active:opacity-80"
                  >
                    <Text className="font-semibold text-white">{t("educator.onboarding.step1Cta")} →</Text>
                  </Pressable>
                </View>
              )}

              {onboardingStep === 2 && (
                <View className="p-4">
                  <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <IconSymbol name="waveform" size={20} color="#fff" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">
                    {t("educator.onboarding.step2Title")}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {t("educator.onboarding.step2Desc")}
                  </Text>
                  <Pressable
                    onPress={() => { router.push("/educator/courses" as any); setOnboardingStep(3); }}
                    className="mt-4 items-center rounded-xl bg-blue-500 py-3 active:opacity-80"
                  >
                    <Text className="font-semibold text-white">{t("educator.onboarding.step2Cta")} →</Text>
                  </Pressable>
                </View>
              )}

              {onboardingStep === 3 && (
                <View className="p-4">
                  <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <IconSymbol name="person.2.fill" size={20} color="#fff" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">
                    {t("educator.onboarding.step3Title")}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {t("educator.onboarding.step3Desc")}
                  </Text>
                  <Pressable
                    onPress={() => { router.push("/groups" as any); dismissOnboarding(); }}
                    className="mt-4 items-center rounded-xl bg-blue-500 py-3 active:opacity-80"
                  >
                    <Text className="font-semibold text-white">{t("educator.onboarding.step3Cta")} →</Text>
                  </Pressable>
                </View>
              )}

              <Pressable onPress={dismissOnboarding} className="items-center pb-4">
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">{t("educator.onboarding.skip")}</Text>
              </Pressable>
            </View>
          )}

          <View className="px-5 pt-4">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.5px] text-neutral-400 dark:text-neutral-500">
              {t("educator.nav.overview")}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon="checkmark.circle.fill"
                label={t("educator.stats.pendingContributions")}
                value={educatorStats?.pendingContributions ?? 0}
              />
              <StatCard
                icon="waveform"
                label={t("educator.stats.pendingLessons")}
                value={educatorStats?.pendingLessons ?? 0}
              />
              <StatCard
                icon="book.fill"
                label={t("educator.stats.dictionaryEntries")}
                value={educatorStats?.dictionaryEntries ?? 0}
              />
              <StatCard
                icon="chart.bar.fill"
                label={t("educator.stats.approvedContributions")}
                value={educatorStats?.approvedContributions ?? 0}
              />
            </View>
          </View>

          <View className="px-5 pt-6">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.5px] text-neutral-400 dark:text-neutral-500">
              {t("admin.overview.quickActions")}
            </Text>
            <View className="gap-3">
              <ActionRow
                icon="checkmark.circle.fill"
                label={t("educator.nav.review")}
                detail={t("educator.review.subtitle")}
                onPress={() => router.push("/review")}
              />
              <ActionRow
                icon="character.book.closed"
                label={t("educator.nav.dictionary")}
                detail={t("profile.dictionary")}
                onPress={() => router.push("/educator/dictionary")}
              />
              <ActionRow
                icon="book.fill"
                label={t("educator.nav.lessons")}
                detail={t("learn.webSubtitle")}
                onPress={() => router.push("/educator/courses")}
              />
              {currentUser && canManageBounties(currentUser) ? (
                <ActionRow
                  icon="star.fill"
                  label={t("profile.bounties")}
                  detail={t("admin.overview.manageCourses")}
                  onPress={() => router.push("/bounties")}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
