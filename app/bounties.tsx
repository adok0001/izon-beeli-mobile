import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { useBounties, type Bounty } from "@/lib/hooks/use-bounties";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function BountyCard({ bounty }: { bounty: Bounty }) {
  const router = useRouter();
  const categoryLabel = bounty.category
    ? CATEGORY_LABELS[bounty.category as DictionaryCategory] ?? bounty.category
    : null;

  return (
    <View className="mb-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row gap-1.5">
          <View className="rounded-full bg-blue-100 px-2.5 py-0.5 dark:bg-blue-900">
            <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {getLanguageName(bounty.languageId)}
            </Text>
          </View>
          {categoryLabel && (
            <View className="rounded-full bg-neutral-200 px-2.5 py-0.5 dark:bg-neutral-700">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                {categoryLabel}
              </Text>
            </View>
          )}
        </View>
        <View className="rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-900">
          <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
            +{bounty.xpReward} XP bonus
          </Text>
        </View>
      </View>

      <Text className="mb-1 text-base font-bold text-neutral-900 dark:text-white">
        {bounty.title}
      </Text>
      <Text className="mb-3 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
        {bounty.description}
      </Text>

      {bounty.createdByName && (
        <Text className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          Created by {bounty.createdByName}
        </Text>
      )}

      {/* Progress bar */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {bounty.currentCount} / {bounty.targetCount}
          </Text>
          <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {bounty.progressPercent}%
          </Text>
        </View>
        <View className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <View
            className="h-2 rounded-full bg-amber-500"
            style={{ width: `${bounty.progressPercent}%` }}
          />
        </View>
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/contribute",
            params: {
              languageId: bounty.languageId,
              ...(bounty.category ? { category: bounty.category } : {}),
            },
          } as any)
        }
        className="items-center rounded-xl bg-amber-500 py-3 active:opacity-80"
      >
        <Text className="font-semibold text-white">Contribute</Text>
      </Pressable>
    </View>
  );
}

export default function BountiesScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { data, isLoading, refetch } = useBounties(selectedLanguageId);
  const { data: currentUser } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <>
      <Stack.Screen options={{ title: "Bounties", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <BountyCard bounty={item} />}
          ListEmptyComponent={
            <View className="items-center px-8 py-20">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <IconSymbol name="star.fill" size={28} color="#f59e0b" />
              </View>
              <Text className="text-center text-base font-semibold text-neutral-500 dark:text-neutral-400">
                {isLoading ? "Loading..." : "No active bounties"}
              </Text>
              {!isLoading && (
                <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
                  Check back later for content bounties with bonus XP rewards.
                </Text>
              )}
            </View>
          }
        />

        {/* Admin FAB */}
        {currentUser?.isAdmin && (
          <Pressable
            onPress={() => router.push("/bounty-create" as any)}
            className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-amber-500 shadow-md active:opacity-80"
          >
            <IconSymbol name="plus" size={26} color="#fff" />
          </Pressable>
        )}
      </SafeAreaView>
    </>
  );
}
