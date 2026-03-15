import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNotificationStore } from "@/store/notification-store";

export function NotificationBell() {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      className="relative h-9 w-9 items-center justify-center"
      hitSlop={8}
    >
      <IconSymbol name="bell.fill" size={22} color="#6b7280" />
      {unreadCount > 0 && (
        <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1">
          <Text className="text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
