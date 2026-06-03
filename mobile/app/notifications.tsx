import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNotificationStore } from "@/store/notification-store";
import type { InAppNotification, NotificationType } from "@/types";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  word_of_day: { icon: "star.fill", color: "#3b82f6" },
  streak_reminder: { icon: "flame.fill", color: "#f59e0b" },
  assignment_due: { icon: "calendar", color: "#8b5cf6" },
  achievement: { icon: "trophy.fill", color: "#22c55e" },
  broadcast: { icon: "megaphone", color: "#6b7280" },
  reengagement: { icon: "flame.fill", color: "#f59e0b" },
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return i18n.t("time.justNow");
  if (diffMins < 60) return i18n.t("time.minutesAgo", { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return i18n.t("time.hoursAgo", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return i18n.t("time.daysAgo", { count: diffDays });
}

function NotificationRow({ item }: { item: InAppNotification }) {
  const markRead = useNotificationStore((s) => s.markRead);
  const config = TYPE_CONFIG[item.type] ?? { icon: "bell.fill", color: "#6b7280" };
  const iconName = (item.icon ?? config.icon) as any;

  return (
    <Pressable
      onPress={() => markRead(item.id)}
      className={`mb-2 rounded-xl p-4 ${
        item.read
          ? "bg-neutral-50 dark:bg-neutral-800/50"
          : "bg-blue-50 dark:bg-blue-900/20"
      }`}
    >
      <View className="flex-row items-start">
        <View className="mr-3 mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
          <IconSymbol name={iconName} size={16} color={config.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm font-semibold ${
                item.read
                  ? "text-neutral-600 dark:text-neutral-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </View>
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {item.body}
          </Text>
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { notifications, markAllRead, unreadCount } =
    useNotificationStore();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("notifications.title"),
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text className="text-sm font-medium text-blue-500">
                  {t("notifications.markAllRead")}
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <NotificationRow item={item} />}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <IconSymbol name="bell" size={48} color="#d1d5db" />
              <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
                {t("notifications.noNotifications")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
