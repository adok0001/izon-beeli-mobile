import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useClassroomStore } from "@/store/classroom-store";
import { getLanguageName } from "@/lib/mock-data";
import type { Group } from "@/types";

function GroupCard({ group }: { group: Group }) {
  const router = useRouter();
  const memberCount = group.members.length;

  return (
    <Pressable
      onPress={() => router.push(`/classroom/${group.id}`)}
      className="mb-3 rounded-xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-lg font-bold text-neutral-900 dark:text-white">
          {group.name}
        </Text>
        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
      </View>
      <View className="mt-2 flex-row items-center gap-4">
        <View className="flex-row items-center">
          <IconSymbol name="person.2.fill" size={14} color="#6b7280" />
          <Text className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
            {memberCount} members
          </Text>
        </View>
        <View className="flex-row items-center">
          <IconSymbol name="book.fill" size={14} color="#6b7280" />
          <Text className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
            {getLanguageName(group.languageId)}
          </Text>
        </View>
      </View>
      <View className="mt-2 flex-row items-center rounded-lg bg-neutral-100 px-3 py-1.5 dark:bg-neutral-700">
        <IconSymbol name="key.fill" size={12} color="#9ca3af" />
        <Text className="ml-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          {group.inviteCode}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ClassroomScreen() {
  const router = useRouter();
  const { groups } = useClassroomStore();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Classroom",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/classroom/create")}
              hitSlop={8}
            >
              <IconSymbol name="plus" size={22} color="#3b82f6" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GroupCard group={item} />}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <IconSymbol name="person.3.fill" size={48} color="#d1d5db" />
              <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
                No groups yet. Create a group or join one with an invite code.
              </Text>
            </View>
          }
          ListHeaderComponent={
            <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              Manage your learning groups and track member progress.
            </Text>
          }
        />
      </SafeAreaView>
    </>
  );
}
