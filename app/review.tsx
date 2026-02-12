import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  usePendingContributions,
  useReviewContribution,
  type PendingContribution,
} from "@/lib/hooks/use-contributions";
import { CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { getLanguageName } from "@/lib/mock-data";

function ContributionCard({
  item,
  onApprove,
  onReject,
  isPending,
}: {
  item: PendingContribution;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  return (
    <View className="mx-5 mb-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            {item.word}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.english}
          </Text>
        </View>
        <View className="rounded-md bg-blue-100 px-2 py-1 dark:bg-blue-900">
          <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {item.type}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row flex-wrap gap-2">
        <View className="rounded-md bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
          <Text className="text-xs text-neutral-600 dark:text-neutral-400">
            {CATEGORY_LABELS[item.category as DictionaryCategory] ?? item.category}
          </Text>
        </View>
        <View className="rounded-md bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
          <Text className="text-xs text-neutral-600 dark:text-neutral-400">
            {getLanguageName(item.languageId)}
          </Text>
        </View>
      </View>

      {item.pronunciation && (
        <Text className="mt-2 text-sm italic text-neutral-500 dark:text-neutral-400">
          /{item.pronunciation}/
        </Text>
      )}

      {item.example && (
        <View className="mt-2 rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            {item.example}
          </Text>
          {item.exampleTranslation && (
            <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {item.exampleTranslation}
            </Text>
          )}
        </View>
      )}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={onReject}
          disabled={isPending}
          className="flex-1 items-center rounded-lg bg-red-50 py-2.5 dark:bg-red-950"
        >
          <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
            Reject
          </Text>
        </Pressable>
        <Pressable
          onPress={onApprove}
          disabled={isPending}
          className="flex-1 items-center rounded-lg bg-green-500 py-2.5"
        >
          <Text className="text-sm font-semibold text-white">Approve</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { data: pending, isLoading, refetch } = usePendingContributions();
  const review = useReviewContribution();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleReview = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve" : "Reject";
    Alert.alert(
      `${label} this contribution?`,
      action === "approve"
        ? "This word will be added to the dictionary."
        : "This contribution will be rejected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: () => review.mutate({ id, action }),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Review Contributions" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <FlatList
          data={pending ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <ContributionCard
              item={item}
              onApprove={() => handleReview(item.id, "approve")}
              onReject={() => handleReview(item.id, "reject")}
              isPending={review.isPending}
            />
          )}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <IconSymbol name="checkmark.circle.fill" size={40} color="#22c55e" />
              <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
                {isLoading
                  ? "Loading contributions..."
                  : "No pending contributions to review."}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
