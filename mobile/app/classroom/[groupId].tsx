import { LoadingScreen } from "@/components/loading-screen";
import { getAccent } from "@/constants/accent-colors";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MemberCard } from "@/components/classroom/member-card";
import { AssignmentCard } from "@/components/classroom/assignment-card";
import {
  useClassroomGroups,
  useGroupAssignments,
  useGroupProgress,
  useLeaveGroup,
  useRemoveMember,
  useDeleteAssignment,
} from "@/lib/hooks/use-classroom";
import { getLanguageName } from "@/lib/mock-data";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useTranslation } from "react-i18next";
import type { GroupMember, AssignedLesson } from "@/types";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const { data: groups = [], isLoading: loadingGroups } = useClassroomGroups();
  const { data: assignments = [], isLoading: loadingAssignments } = useGroupAssignments(groupId);
  const { data: progress = [] } = useGroupProgress(groupId);

  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveMember();
  const deleteAssignment = useDeleteAssignment();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const group = groups.find((g) => g.id === groupId);
  // myRole is embedded by the server based on the authenticated user
  const isTeacher = group?.myRole === "teacher";

  if (loadingGroups) {
    return (
      <>
        <Stack.Screen options={{ title: "Group" }} />
        <LoadingScreen />
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

  const handleCopyCode = () => {
    Clipboard.setString(group.inviteCode);
    toastSuccess(t("classroom.codeCopied"), "");
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my Beeli classroom group "${group.name}" with code: ${group.inviteCode}`,
      });
    } catch {
      // user dismissed share sheet
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t("classroom.leaveGroup"),
      t("classroom.leaveGroupConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("classroom.leave"),
          style: "destructive",
          onPress: () => {
            leaveGroup.mutate(groupId, {
              onSuccess: () => router.replace("/classroom"),
              onError: (err) => toastError("Error", err.message),
            });
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    removeMember.mutate(
      { groupId, memberId: member.userId },
      { onError: (err) => toastError("Error", err.message) }
    );
  };

  const handleDeleteAssignment = (assignment: AssignedLesson) => {
    deleteAssignment.mutate(
      { assignmentId: assignment.id, groupId },
      { onError: (err) => toastError("Error", err.message) }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () =>
            isTeacher ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/classroom/assign",
                    params: { groupId: group.id },
                  })
                }
                hitSlop={8}
              >
                <IconSymbol name="plus.circle.fill" size={22} color={getAccent("blue").solid} />
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
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
              {/* Invite code — tap to copy, long-press to share */}
              <Pressable
                onPress={handleCopyCode}
                onLongPress={handleShareCode}
                className="flex-row items-center rounded-lg bg-neutral-100 px-2 py-1 active:opacity-60 dark:bg-neutral-700"
              >
                <IconSymbol name="key.fill" size={12} color="#9ca3af" />
                <Text className="ml-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {group.inviteCode}
                </Text>
                <IconSymbol name="doc.on.doc" size={11} color="#9ca3af" className="ml-1" />
              </Pressable>
            </View>
            {/* Share invite code row */}
            <Pressable
              onPress={handleShareCode}
              className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2 active:opacity-70 dark:bg-blue-900/20"
            >
              <IconSymbol name="square.and.arrow.up" size={14} color={getAccent("blue").solid} />
              <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t("classroom.shareCode")}
              </Text>
            </Pressable>
          </View>

          {/* Members */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("classroom.members", { count: enrichedMembers.length })}
          </Text>
          {enrichedMembers.length === 0 ? (
            <Text className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {t("classroom.noMembers")}
            </Text>
          ) : (
            enrichedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onRemove={
                  isTeacher && member.role !== "teacher"
                    ? handleRemoveMember
                    : undefined
                }
              />
            ))
          )}

          {/* Assignments */}
          <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("classroom.assignments", { count: assignments.length })}
          </Text>
          {loadingAssignments ? (
            <ActivityIndicator size="small" color={getAccent("blue").solid} className="py-4" />
          ) : assignments.length === 0 ? (
            <Text className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {t("classroom.noAssignments")}
            </Text>
          ) : (
            assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={{ ...a, assignedBy: a.assignedBy, dueDate: a.dueDate ?? undefined }}
                onPress={() => router.push(`/lesson/${a.lessonId}`)}
                onDelete={isTeacher ? handleDeleteAssignment : undefined}
              />
            ))
          )}

          {/* Leave group */}
          <Pressable
            onPress={handleLeaveGroup}
            className="mt-8 items-center rounded-xl border border-red-200 py-3 active:opacity-70 dark:border-red-900/40"
          >
            <Text className="text-sm font-semibold text-red-500">
              {t("classroom.leaveGroup")}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
