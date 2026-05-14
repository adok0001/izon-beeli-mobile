import { useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useClassroomGroups, useCreateAssignment } from "@/lib/hooks/use-classroom";
import { useLanguageLessons } from "@/lib/hooks/use-courses";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDuration } from "@/lib/mock-data";
import type { Lesson } from "@/types";

export default function AssignLessonScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: groups = [] } = useClassroomGroups();
  const group = groups.find((g) => g.id === groupId);
  const createAssignment = useCreateAssignment();
  const [selected, setSelected] = useState<string | null>(null);
  const { toast, error: toastError, dismiss: dismissToast } = useToast();

  const { data: allLessons = [], isLoading } = useLanguageLessons(group?.languageId ?? "");

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-neutral-500">Group not found</Text>
        </View>
      </>
    );
  }

  const handleAssign = () => {
    if (!selected) return;
    createAssignment.mutate(
      { groupId, lessonId: selected },
      {
        onSuccess: () => router.back(),
        onError: (err) => toastError("Error", err.message),
      }
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Pressable onPress={() => router.back()}>
            <Text className="text-base text-neutral-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            Assign Lesson
          </Text>
          <Pressable onPress={handleAssign} disabled={!selected || createAssignment.isPending}>
            <Text
              className={`text-base font-semibold ${
                selected && !createAssignment.isPending
                  ? "text-blue-500"
                  : "text-neutral-300 dark:text-neutral-600"
              }`}
            >
              {createAssignment.isPending ? "Assigning..." : "Assign"}
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={allLessons}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 pb-8 pt-4"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: { item: Lesson }) => (
              <Pressable
                onPress={() => setSelected(item.id)}
                className={`mb-2 flex-row items-center rounded-xl border-2 p-3 ${
                  selected === item.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-neutral-200 dark:border-neutral-700"
                }`}
              >
                <IconSymbol
                  name={selected === item.id ? "checkmark.circle.fill" : "circle"}
                  size={20}
                  color={selected === item.id ? "#3b82f6" : "#d1d5db"}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-neutral-900 dark:text-white">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                {item.duration && (
                  <Text className="text-xs text-neutral-400">
                    {formatDuration(item.duration)}
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text className="py-8 text-center text-neutral-400">
                No lessons available for this language.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
