import { View, Text, Pressable, Alert } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLesson } from "@/lib/hooks/use-courses";
import { useTranslation } from "react-i18next";
import type { AssignedLesson } from "@/types";

interface AssignmentCardProps {
  assignment: AssignedLesson;
  onPress: () => void;
  onDelete?: (assignment: AssignedLesson) => void;
}

export function AssignmentCard({ assignment, onPress, onDelete }: AssignmentCardProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { data: lesson } = useLesson(assignment.lessonId);
  const isOverdue =
    assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const dueDateStr = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const handleDeletePress = () => {
    Alert.alert(
      t("classroom.deleteAssignment"),
      t("classroom.deleteAssignmentConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("classroom.delete"),
          style: "destructive",
          onPress: () => onDelete?.(assignment),
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 rounded-xl border border-neutral-200 p-3 active:opacity-70 dark:border-neutral-700"
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="flex-1 text-base font-semibold text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {lesson?.title ?? "Unknown Lesson"}
        </Text>
        <View className="flex-row items-center gap-2">
          {onDelete && (
            <Pressable onPress={handleDeletePress} hitSlop={8}>
              <IconSymbol name="trash" size={16} color={M.error} />
            </Pressable>
          )}
          <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
        </View>
      </View>
      <View className="mt-1 flex-row items-center gap-3">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          By {assignment.assignedBy}
        </Text>
        {dueDateStr && (
          <View className="flex-row items-center">
            <IconSymbol
              name="calendar"
              size={12}
              color={isOverdue ? M.error : M.muted}
            />
            <Text
              className={`ml-1 text-xs ${
                isOverdue
                  ? "font-semibold text-red-500"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {t("classroom.dueLabel", { date: dueDateStr })}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
