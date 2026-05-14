import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRegenerateDailyChallenges, useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useTranslation } from "react-i18next";
import type { ChallengeType, DailyChallenge } from "@/types";

const CHALLENGE_CONFIG: Record<
  ChallengeType,
  { icon: string; color: string; route: string }
> = {
  complete_quiz: { icon: "trophy.fill", color: "#f59e0b", route: "/quiz" },
  review_words: { icon: "brain.fill", color: "#8b5cf6", route: "/word-review" },
  listen_lesson: { icon: "headphones", color: "#3b82f6", route: "/(tabs)/learn" },
  complete_lesson: { icon: "checkmark.circle.fill", color: "#22c55e", route: "/(tabs)/learn" },
  save_words: { icon: "bookmark.fill", color: "#ec4899", route: "/dictionary" },
};

function ChallengeItem({ challenge }: { challenge: DailyChallenge }) {
  const router = useRouter();
  const { t } = useTranslation();

  const config = CHALLENGE_CONFIG[challenge.challengeType] ?? {
    icon: "star.fill",
    color: "#3b82f6",
    route: "/(tabs)/learn",
  };

  const progress = Math.min(challenge.progress / challenge.target, 1);

  return (
    <Pressable
      onPress={() => router.push(config.route as any)}
      className="rounded-xl bg-neutral-50 px-3 py-2.5 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="flex-row items-center">
        <View
          className="mr-2.5 h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <IconSymbol name={config.icon as any} size={17} color={config.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {challenge.title}
            </Text>
            <Text className="text-[10px] font-semibold" style={{ color: config.color }}>
              +{challenge.xpReward} XP
            </Text>
          </View>
          <View className="mt-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: challenge.completed ? "#22c55e" : config.color,
              }}
            />
          </View>
          <Text className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
            {challenge.progress} / {challenge.target}
            {challenge.completed && (
              <Text className="font-semibold text-green-500"> · {t("learn.complete")}</Text>
            )}
          </Text>
        </View>
        {challenge.completed ? (
          <IconSymbol name="checkmark.circle.fill" size={18} color="#22c55e" className="ml-2" />
        ) : (
          <IconSymbol name="chevron.right" size={14} color="#9ca3af" className="ml-2" />
        )}
      </View>
    </Pressable>
  );
}

export function DailyChallengeCards() {
  const { t } = useTranslation();
  const { data: challenges, isLoading } = useTodayChallenges();
  const regenerate = useRegenerateDailyChallenges();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await regenerate();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || !challenges?.length) return null;

  const anyCompleted = challenges.some((c) => c.completed);

  return (
    <View className="gap-3">
      {challenges.map((challenge) => (
        <ChallengeItem key={challenge.id} challenge={challenge} />
      ))}
      {!anyCompleted && (
        <Pressable
          onPress={handleRefresh}
          disabled={isRefreshing}
          className="flex-row items-center justify-center gap-1.5 py-1 active:opacity-60"
          style={{ opacity: isRefreshing ? 0.5 : 1 }}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#9ca3af" />
          ) : (
            <>
              <IconSymbol name="arrow.clockwise" size={13} color="#9ca3af" />
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                {t("dailyChallenge.refresh")}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
