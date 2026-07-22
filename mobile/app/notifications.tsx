import { isIconSymbolName, type IconSymbolName } from "@/components/ui/icon-symbol-mapping";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useNotificationStore } from "@/store/notification-store";
import type { InAppNotification, NotificationType } from "@/types";
import { useTranslation } from "react-i18next";
import { timeAgo } from "@/lib/time-ago";

function NotificationRow({ item }: { item: InAppNotification }) {
  const M = useMuseumTheme();
  const markRead = useNotificationStore((s) => s.markRead);

  const TYPE_CONFIG: Record<NotificationType, { icon: IconSymbolName; color: string }> = {
    word_of_day: { icon: "star.fill", color: getAccent("blue").solid },
    proverb_of_month: { icon: "quote.opening", color: "#C4862A" },
    song_of_week: { icon: "music.note", color: M.success },
    streak_reminder: { icon: "flame.fill", color: M.warning },
    assignment_due: { icon: "calendar", color: getAccent("purple").solid },
    achievement: { icon: "trophy.fill", color: M.success },
    broadcast: { icon: "megaphone", color: M.muted },
    reengagement: { icon: "flame.fill", color: M.warning },
  };

  const config = TYPE_CONFIG[item.type] ?? { icon: "bell.fill", color: M.muted };
  // item.icon is server-supplied, so it can name a symbol we can't render —
  // fall back to the type's own icon rather than showing a blank circle.
  const iconName =
    item.icon && isIconSymbolName(item.icon) ? item.icon : config.icon;

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
          <Text style={{ marginTop: 4, fontSize: 11, color: M.muted }}>{timeAgo(item.createdAt, { alwaysRelative: true })}</Text>
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
