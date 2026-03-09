import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTodayChallenge } from "@/lib/hooks/use-daily-challenge";
import type { ChallengeType } from "@/types";

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

export function DailyChallengeCard() {
  const router = useRouter();
  const { data: challenge, isLoading } = useTodayChallenge();

  if (isLoading || !challenge) return null;

  const config = CHALLENGE_CONFIG[challenge.challengeType] ?? {
    icon: "star.fill",
    color: "#3b82f6",
    route: "/(tabs)/learn",
  };

  const progress = Math.min(challenge.progress / challenge.target, 1);

  const handlePress = () => {
    router.push(config.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mb-3 rounded-2xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="flex-row items-center">
        <View
          className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <IconSymbol name={config.icon as any} size={22} color={config.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Daily Challenge
            </Text>
            <Text className="text-xs font-semibold" style={{ color: config.color }}>
              +{challenge.xpReward} XP
            </Text>
          </View>
          <Text className="text-base font-bold text-neutral-900 dark:text-white">
            {challenge.title}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {challenge.description}
          </Text>
        </View>
        {challenge.completed ? (
          <IconSymbol name="checkmark.circle.fill" size={24} color="#22c55e" />
        ) : (
          <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
        )}
      </View>

      {/* Progress bar */}
      <View className="mt-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
            {challenge.progress} / {challenge.target}
          </Text>
          {challenge.completed && (
            <Text className="text-xs font-semibold text-green-500">
              Complete!
            </Text>
          )}
        </View>
        <View className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: challenge.completed ? "#22c55e" : config.color,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}
