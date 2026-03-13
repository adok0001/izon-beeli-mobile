import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMyContributions, type MyContribution } from "@/lib/hooks/use-contributions";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { getLanguageName } from "@/lib/mock-data";

const STATUS_CONFIG = {
  submitted: { label: "Pending", color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-900" },
  approved: { label: "Approved", color: "#22c55e", bg: "bg-green-100 dark:bg-green-900" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "bg-red-100 dark:bg-red-900" },
} as const;

function ContributionRow({ item }: { item: MyContribution }) {
  const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.submitted;
  const categoryLabel = CATEGORY_LABELS[item.category as DictionaryCategory] ?? item.category;

  return (
    <View className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {item.word}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.english}
          </Text>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {categoryLabel}
              </Text>
            </View>
            <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {getLanguageName(item.languageId)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end gap-1">
          <View className={`rounded-full px-2.5 py-1 ${config.bg}`}>
            <Text className="text-xs font-semibold" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
          {item.status === "approved" && item.xpAwarded != null && (
            <View className="flex-row gap-1">
              <View className="rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900">
                <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  +{item.xpAwarded} XP
                </Text>
              </View>
              {item.bountyXpAwarded != null && item.bountyXpAwarded > 0 && (
                <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900">
                  <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    +{item.bountyXpAwarded} bounty
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {item.status === "rejected" && item.reviewNote && (
        <View className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-900/20">
          <Text className="text-xs font-semibold uppercase tracking-wider text-red-400 dark:text-red-500">
            Reviewer note
          </Text>
          <Text className="mt-1 text-sm text-red-700 dark:text-red-300">
            {item.reviewNote}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function MyContributionsScreen() {
  const { data, isLoading, refetch } = useMyContributions();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const submissions = data ?? [];
  const approvedCount = submissions.filter((c) => c.status === "approved").length;
  const pendingCount = submissions.filter((c) => c.status === "submitted").length;
  const totalXp = submissions.reduce(
    (sum, c) => sum + (c.xpAwarded ?? 0) + (c.bountyXpAwarded ?? 0),
    0
  );

  return (
    <>
      <Stack.Screen options={{ title: "My Contributions", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        {/* Stats row */}
        {submissions.length > 0 && (
          <View className="flex-row border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-green-500">{approvedCount}</Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">Approved</Text>
            </View>
            <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-amber-500">{pendingCount}</Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">Pending</Text>
            </View>
            <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-neutral-700 dark:text-neutral-300">
                {submissions.length}
              </Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">Total</Text>
            </View>
            {totalXp > 0 && (
              <>
                <View className="w-[1px] bg-neutral-100 dark:bg-neutral-800" />
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold text-blue-500">{totalXp}</Text>
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">XP Earned</Text>
                </View>
              </>
            )}
          </View>
        )}

        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <ContributionRow item={item} />}
          ListEmptyComponent={
            <View className="items-center px-8 py-20">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <IconSymbol name="doc.text" size={28} color="#9ca3af" />
              </View>
              <Text className="text-center text-base font-semibold text-neutral-500 dark:text-neutral-400">
                {isLoading ? "Loading..." : "No contributions yet"}
              </Text>
              {!isLoading && (
                <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
                  Submit words or phrases from the Contribute tab to see them here.
                </Text>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
