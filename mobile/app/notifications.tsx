import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useNotificationStore } from "@/store/notification-store";
import type { InAppNotification, NotificationType } from "@/types";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  word_of_day: { icon: "star.fill", color: "#3b82f6" },
  proverb_of_month: { icon: "quote.opening", color: "#C4862A" },
  song_of_week: { icon: "music.note", color: "#22c55e" },
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
  const M = useMuseumTheme();
  const markRead = useNotificationStore((s) => s.markRead);
  const config = TYPE_CONFIG[item.type] ?? { icon: "bell.fill", color: "#6b7280" };
  const iconName = (item.icon ?? config.icon) as any;

  return (
    <Pressable
      onPress={() => markRead(item.id)}
      style={{ marginBottom: 8, borderRadius: 12, padding: 16, backgroundColor: item.read ? M.card : M.accentGlow, borderWidth: 1, borderColor: item.read ? M.border : M.accentBorder, borderLeftWidth: item.read ? 1 : 4, borderLeftColor: item.read ? M.border : M.accent }}
      className="active:opacity-70"
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ marginRight: 12, marginTop: 2, height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border }}>
          <IconSymbol name={iconName} size={16} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: item.read ? M.sub : M.text }} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && (
              <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: M.accent }} />
            )}
          </View>
          <Text style={{ marginTop: 2, fontSize: 13, color: M.sub }}>{item.body}</Text>
          <Text style={{ marginTop: 4, fontSize: 11, color: M.muted }}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const M = useMuseumTheme();
  const { notifications, markAllRead, unreadCount } = useNotificationStore();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("notifications.title"),
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: M.accent }}>
                  {t("notifications.markAllRead")}
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <NotificationRow item={item} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 64 }}>
              <IconSymbol name="bell" size={48} color={M.border} />
              <Text style={{ marginTop: 16, textAlign: "center", fontSize: 15, color: M.muted }}>
                {t("notifications.noNotifications")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
