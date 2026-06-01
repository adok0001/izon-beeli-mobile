import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLeaderboard, type LeaderboardEntry } from "@/lib/hooks/use-leaderboard";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, avatarUrl }: Readonly<{ name: string; avatarUrl?: string | null }>) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        className="w-9 h-9 rounded-full"
        resizeMode="cover"
      />
    );
  }
  return (
    <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center">
      <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">
        {getInitials(name)}
      </Text>
    </View>
  );
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const gold = rank === 1;
  const silver = rank === 2;
  const bronze = rank === 3;

  const bg = gold
    ? "bg-yellow-100 dark:bg-yellow-900"
    : silver
    ? "bg-neutral-200 dark:bg-neutral-700"
    : bronze
    ? "bg-orange-100 dark:bg-orange-900"
    : "bg-neutral-100 dark:bg-neutral-800";

  const text = gold
    ? "text-yellow-700 dark:text-yellow-300"
    : silver
    ? "text-neutral-600 dark:text-neutral-300"
    : bronze
    ? "text-orange-700 dark:text-orange-300"
    : "text-neutral-500 dark:text-neutral-400";

  return (
    <View className={`w-8 h-8 rounded-full items-center justify-center ${bg}`}>
      <Text className={`text-sm font-bold ${text}`}>{rank}</Text>
    </View>
  );
}

function EntryRow({ entry }: Readonly<{ entry: LeaderboardEntry }>) {
  const highlighted = entry.isCurrentUser;
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl border mb-2 ${
        highlighted
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <RankBadge rank={entry.rank} />
      <Avatar name={entry.name} avatarUrl={entry.avatarUrl} />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1">
          <Text
            numberOfLines={1}
            className={`font-semibold text-sm ${
              highlighted
                ? "text-blue-700 dark:text-blue-300"
                : "text-neutral-900 dark:text-neutral-100"
            }`}
          >
            {entry.name}
          </Text>
          {highlighted && (
            <Text className="text-xs text-blue-500 dark:text-blue-400 font-medium">You</Text>
          )}
        </View>
        {entry.selectedLanguageId ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
            {entry.selectedLanguageId}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        {entry.streak > 0 && (
          <View className="flex-row items-center gap-0.5">
            <IconSymbol name="flame.fill" size={14} color="#f97316" />
            <Text className="text-xs font-semibold text-orange-500">{entry.streak}</Text>
          </View>
        )}
        <View className="flex-row items-center gap-0.5">
          <IconSymbol name="star.fill" size={14} color="#0a7ea4" />
          <Text className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {entry.points.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { data, isLoading, refetch, isRefetching } = useLeaderboard();

  const topEntries = data?.filter((e) => e.rank >= 1 && e.rank <= 50) ?? [];
  const currentUserEntry = data?.find((e) => e.isCurrentUser);
  const currentUserInTop = topEntries.some((e) => e.isCurrentUser);
  const showCurrentUserBanner = !isLoading && currentUserEntry && !currentUserInTop;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
        <View className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 items-center justify-center">
          <IconSymbol name="trophy.fill" size={20} color={colorScheme === "dark" ? "#facc15" : "#ca8a04"} />
        </View>
        <View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {t("leaderboard.title")}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("leaderboard.subtitle")}
          </Text>
        </View>
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {!isLoading && topEntries.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="trophy.fill" size={48} color="#d1d5db" />
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-3">
            {t("leaderboard.empty")}
          </Text>
        </View>
      )}

      {!isLoading && topEntries.length > 0 && (
        <FlatList
          data={topEntries}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2 pb-8"
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => <EntryRow entry={item} />}
          ListFooterComponent={
            showCurrentUserBanner ? (
              <View>
                <View className="flex-row items-center gap-2 py-2">
                  <View className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {t("leaderboard.yourRank")}
                  </Text>
                  <View className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                </View>
                <EntryRow entry={currentUserEntry!} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
