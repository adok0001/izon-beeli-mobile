import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MemberCard } from "@/components/classroom/member-card";
import { AssignmentCard } from "@/components/classroom/assignment-card";
import {
  useClassroomGroups,
  useGroupAssignments,
  useGroupProgress,
} from "@/lib/hooks/use-classroom";
import { getLanguageName } from "@/lib/mock-data";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: groups = [], isLoading: loadingGroups } = useClassroomGroups();
  const { data: assignments = [], isLoading: loadingAssignments } = useGroupAssignments(groupId);
  const { data: progress = [] } = useGroupProgress(groupId);

  const group = groups.find((g) => g.id === groupId);

  if (loadingGroups) {
    return (
      <>
        <Stack.Screen options={{ title: "Group" }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ title: "Group" }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-lg text-neutral-500 dark:text-neutral-400">
            Group not found
          </Text>
        </View>
      </>
    );
  }

  // Merge progress data into members
  const enrichedMembers = group.members.map((m) => {
    const p = progress.find((pr) => pr.userId === m.userId);
    return {
      ...m,
      lessonsCompleted: p?.lessonsCompleted ?? m.lessonsCompleted,
      streak: p?.streak ?? m.streak,
      points: p?.points ?? m.points,
    };
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/classroom/assign",
                  params: { groupId: group.id },
                })
              }
              hitSlop={8}
            >
              <IconSymbol name="plus.circle.fill" size={22} color="#3b82f6" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-8 pt-4"
        >
          {/* Group info */}
          <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {getLanguageName(group.languageId)}
              </Text>
              <View className="flex-row items-center rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
                <IconSymbol name="key.fill" size={12} color="#9ca3af" />
                <Text className="ml-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {group.inviteCode}
                </Text>
              </View>
            </View>
          </View>

          {/* Members */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Members ({enrichedMembers.length})
          </Text>
          {enrichedMembers.length === 0 ? (
            <Text className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No members yet. Share the invite code to add people.
            </Text>
          ) : (
            enrichedMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))
          )}

          {/* Assignments */}
          <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Assignments ({assignments.length})
          </Text>
          {loadingAssignments ? (
            <ActivityIndicator size="small" color="#3b82f6" className="py-4" />
          ) : assignments.length === 0 ? (
            <Text className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No assignments yet. Tap + to assign a lesson.
            </Text>
          ) : (
            assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={{ ...a, assignedBy: a.assignedBy, dueDate: a.dueDate ?? undefined }}
                onPress={() => router.push(`/lesson/${a.lessonId}`)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
