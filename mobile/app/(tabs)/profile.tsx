import { FeedbackModal } from "@/components/feedback-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { canReviewApplications, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { useTourStore } from "@/store/tour-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-neutral-50 px-2 py-4 dark:bg-neutral-800">
      <IconSymbol name={icon as any} size={22} color="#3b82f6" />
      <Text className="mt-1.5 text-lg font-bold text-neutral-900 dark:text-white">
        {value}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-neutral-100 py-3.5 active:opacity-70 dark:border-neutral-800"
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={danger ? "#ef4444" : "#6b7280"}
      />
      <Text
        className={`ml-3 flex-1 text-base ${
          danger
            ? "font-semibold text-red-500"
            : "text-neutral-900 dark:text-white"
        }`}
      >
        {label}
      </Text>
      {detail && (
        <Text className="mr-2 text-sm text-neutral-400 dark:text-neutral-500">
          {detail}
        </Text>
      )}
      {!danger && <IconSymbol name="chevron.right" size={16} color="#9ca3af" />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: currentUser } = useCurrentUser();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const { data: summary } = useProgressSummary();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const activeTour = useTourStore((s) => s.activeTour);
  const isFocused = useIsFocused();

  // Show profile tour when the Profile screen is opened and no other tour is active.
  useEffect(() => {
    if (!isFocused || activeTour || hasSeen("profile")) return;
    const timer = setTimeout(() => showTour("profile"), 250);
    return () => clearTimeout(timer);
  }, [isFocused, activeTour, hasSeen, showTour]);

  const { reset: resetTour, start: startTour } = useTourStore();
  const isAdmin = currentUser?.isAdmin ?? false;
  const reviewerRole = currentUser?.reviewerRole ?? null;
  const displayName = user?.username ?? "Learner";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center border-b border-neutral-100 px-5 pb-6 pt-6 dark:border-neutral-800">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-500">
            <Text className="text-2xl font-bold text-white">{initial}</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {displayName}
          </Text>
          {email ? (
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {email}
            </Text>
          ) : null}
          <View className="mt-2 flex-row gap-2">
            {isAdmin && (
              <View className="rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-900/40">
                <Text className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Admin
                </Text>
              </View>
            )}
            {reviewerRole === "elder" && (
              <View className="rounded-full bg-teal-100 px-3 py-1 dark:bg-teal-900/40">
                <Text className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  {t("reviewerApplication.roleElder")}
                </Text>
              </View>
            )}
            {reviewerRole === "professor" && (
              <View className="rounded-full bg-indigo-100 px-3 py-1 dark:bg-indigo-900/40">
                <Text className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
                  {t("reviewerApplication.roleProfessor")}
                </Text>
              </View>
            )}
            {reviewerRole === "teacher" && (
              <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900/40">
                <Text className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  {t("reviewerApplication.roleTeacher")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="px-5 pt-4 pb-2">
          <View className="items-center mb-4">
            <XpLevelBadge points={summary?.points ?? 0} variant="full" />
          </View>
          <View className="flex-row gap-3">
            <StatCard icon="flame.fill" label={t("profile.streak")} value={String(summary?.streak ?? 0)} />
            <StatCard
              icon="snowflake"
              label={t("profile.freezes")}
              value={String(summary?.freezeCount ?? 0)}
            />
            <StatCard
              icon="checkmark.circle.fill"
              label={t("profile.lessons")}
              value={String(summary?.completedCount ?? 0)}
            />
          </View>
        </View>

        {/* Menu */}
        <View className="px-5">
          <MenuRow
            icon="chart.bar.fill"
            label={t("profile.progressDashboard")}
            onPress={() => router.push("/dashboard")}
          />
          <MenuRow
            icon="book.fill"
            label={t("profile.learning")}
            detail={getLanguageName(selectedLanguageId)}
            onPress={() => router.push("/(tabs)/learn")}
          />
          <MenuRow
            icon="character.book.closed"
            label={t("profile.dictionary")}
            onPress={() => router.push("/dictionary")}
          />
          {(isAdmin || currentUser?.isReviewer) && (
            <MenuRow
              icon="checkmark.shield.fill"
              label={t("profile.reviewContributions")}
              onPress={() => router.push("/review")}
            />
          )}
          {currentUser && canReviewApplications(currentUser) && (
            <MenuRow
              icon="person.badge.clock.fill"
              label={t("profile.reviewApplications")}
              onPress={() => router.push("/reviewer-applications-admin" as any)}
            />
          )}
          <MenuRow
            icon="doc.text.fill"
            label={t("profile.myContributions")}
            onPress={() => router.push("/my-contributions")}
          />
          <MenuRow
            icon="star.fill"
            label={t("profile.bounties")}
            onPress={() => router.push("/bounties")}
          />
          <MenuRow
            icon="trophy.fill"
            label={t("profile.contributors")}
            onPress={() => router.push("/contributors")}
          />
          <MenuRow
            icon="person.3.fill"
            label={t("profile.classroom")}
            onPress={() => router.push("/classroom")}
          />
          <MenuRow
            icon="bell.fill"
            label={t("profile.notifications")}
            onPress={() => router.push("/notifications")}
          />
          <MenuRow
            icon="exclamationmark.bubble"
            label={t("profile.sendFeedback")}
            onPress={() => setFeedbackVisible(true)}
          />
          <MenuRow
            icon="map.fill"
            label={t("profile.restartWelcomeTour")}
            onPress={async () => { await resetTour(); startTour(); }}
          />
          <MenuRow
            icon="gearshape.fill"
            label={t("profile.settings")}
            onPress={() => router.push("/settings")}
          />
          <View className="mt-4">
            <MenuRow
              icon="xmark"
              label={t("profile.signOut")}
              onPress={() => signOut()}
              danger
            />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />

    </SafeAreaView>
  );
}
