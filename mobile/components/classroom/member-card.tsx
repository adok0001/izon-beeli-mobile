import { View, Text, Pressable, Alert } from "react-native";
import { getAccent } from "@/constants/accent-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "react-i18next";
import type { GroupMember } from "@/types";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  teacher: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  parent: { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300" },
  student: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400" },
};

interface MemberCardProps {
  member: GroupMember;
  onRemove?: (member: GroupMember) => void;
}

export function MemberCard({ member, onRemove }: MemberCardProps) {
  const { t } = useTranslation();
  const roleStyle = ROLE_COLORS[member.role] ?? ROLE_COLORS.student;
  const initial = member.name[0]?.toUpperCase() ?? "?";

  const handleRemovePress = () => {
    Alert.alert(
      t("classroom.removeMember"),
      t("classroom.removeMemberConfirm", { name: member.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("classroom.remove"),
          style: "destructive",
          onPress: () => onRemove?.(member),
        },
      ]
    );
  };

  return (
    <View className="mb-2 flex-row items-center rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-500">
        <Text className="text-sm font-bold text-white">{initial}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {member.name}
          </Text>
          <View className={`ml-2 rounded-full px-2 py-0.5 ${roleStyle.bg}`}>
            <Text className={`text-[10px] font-semibold capitalize ${roleStyle.text}`}>
              {member.role}
            </Text>
          </View>
        </View>
        <View className="mt-1 flex-row items-center gap-3">
          <View className="flex-row items-center">
            <IconSymbol name="checkmark.circle.fill" size={12} color="#22c55e" />
            <Text className="ml-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {member.lessonsCompleted}
            </Text>
          </View>
          <View className="flex-row items-center">
            <IconSymbol name="flame.fill" size={12} color={getAccent("amber").solid} />
            <Text className="ml-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {member.streak}
            </Text>
          </View>
          <View className="flex-row items-center">
            <IconSymbol name="star.fill" size={12} color={getAccent("blue").solid} />
            <Text className="ml-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {member.points}
            </Text>
          </View>
        </View>
      </View>
      {onRemove && (
        <Pressable onPress={handleRemovePress} hitSlop={8} className="ml-2 p-1">
          <IconSymbol name="xmark.circle.fill" size={20} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );
}
