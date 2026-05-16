import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useClassroomGroups, useCreateAssignment } from "@/lib/hooks/use-classroom";
import { useLanguageLessons } from "@/lib/hooks/use-courses";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDuration } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/types";

// Minimal inline date picker — renders a native date input on web,
// and a row of +/- controls on native (DateTimePicker is an optional dep).
function DueDatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  const { t } = useTranslation();

  if (Platform.OS === "web") {
    return (
      <input
        type="date"
        value={value ? value.toISOString().slice(0, 10) : ""}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? new Date(v + "T00:00:00") : null);
        }}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          fontSize: 15,
          width: "100%",
          marginBottom: 12,
          backgroundColor: "#f5f5f5",
          color: "#111827",
        }}
      />
    );
  }

  // Native: show selected date + clear button, or a "set" button
  const dateStr = value
    ? value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Simple bump-by-day controls without requiring DateTimePicker package
  const bump = (days: number) => {
    const base = value ?? new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    if (next >= new Date()) onChange(next);
  };

  return (
    <View className="mb-4">
      {value ? (
        <View className="flex-row items-center rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <View className="flex-row items-center gap-2 flex-1">
            <Pressable
              onPress={() => bump(-1)}
              className="rounded-lg bg-white px-3 py-1.5 dark:bg-neutral-700"
            >
              <Text className="text-neutral-700 dark:text-white font-medium">‹</Text>
            </Pressable>
            <Text className="flex-1 text-center text-base text-neutral-900 dark:text-white">
              {dateStr}
            </Text>
            <Pressable
              onPress={() => bump(1)}
              className="rounded-lg bg-white px-3 py-1.5 dark:bg-neutral-700"
            >
              <Text className="text-neutral-700 dark:text-white font-medium">›</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={8} className="ml-3">
            <IconSymbol name="xmark.circle.fill" size={20} color="#9ca3af" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            onChange(tomorrow);
          }}
          className="flex-row items-center rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800"
        >
          <IconSymbol name="calendar.badge.plus" size={18} color="#9ca3af" />
          <Text className="ml-2 text-base text-neutral-400 dark:text-neutral-500">
            {t("classroom.setDueDate")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function AssignLessonScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: groups = [] } = useClassroomGroups();
  const group = groups.find((g) => g.id === groupId);
  const createAssignment = useCreateAssignment();
  const [selected, setSelected] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
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
      {
        groupId,
        lessonId: selected,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      },
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
            <Text className="text-base text-neutral-500">{t("classroom.cancel")}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("classroom.assignLesson")}
          </Text>
          <Pressable onPress={handleAssign} disabled={!selected || createAssignment.isPending}>
            <Text
              className={`text-base font-semibold ${
                selected && !createAssignment.isPending
                  ? "text-blue-500"
                  : "text-neutral-300 dark:text-neutral-600"
              }`}
            >
              {createAssignment.isPending ? t("classroom.assigning") : t("classroom.assign")}
            </Text>
          </Pressable>
        </View>

        {/* Due date picker */}
        <View className="border-b border-neutral-100 px-5 pt-4 dark:border-neutral-800">
          <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("classroom.dueDate")}
          </Text>
          <DueDatePicker value={dueDate} onChange={setDueDate} />
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
                {t("classroom.noLessons")}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
