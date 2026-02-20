import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useLanguageStore } from "@/store/language-store";
import { getLanguageName } from "@/lib/mock-data";

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-neutral-50 px-2 py-4 dark:bg-neutral-800">
      <IconSymbol name={icon as any} size={22} color="#3b82f6" />
      <Text className="mt-1.5 text-lg font-bold text-neutral-900 dark:text-white">
        {value}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-neutral-100 py-3.5 active:opacity-70 dark:border-neutral-800"
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={danger ? "#ef4444" : "#6b7280"}
      />
      <Text
        className={`ml-3 flex-1 text-base ${
          danger
            ? "font-semibold text-red-500"
            : "text-neutral-900 dark:text-white"
        }`}
      >
        {label}
      </Text>
      {detail && (
        <Text className="mr-2 text-sm text-neutral-400 dark:text-neutral-500">
          {detail}
        </Text>
      )}
      {!danger && <IconSymbol name="chevron.right" size={16} color="#9ca3af" />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: summary } = useProgressSummary();
  const { selectedLanguageId } = useLanguageStore();

  const displayName = user?.username ?? "Learner";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center border-b border-neutral-100 px-5 pb-6 pt-6 dark:border-neutral-800">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-500">
            <Text className="text-2xl font-bold text-white">{initial}</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {displayName}
          </Text>
          {email ? (
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {email}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 px-5 py-5">
          <StatCard icon="flame.fill" label="Streak" value={String(summary?.streak ?? 0)} />
          <StatCard icon="star.fill" label="Points" value={String(summary?.points ?? 0)} />
          <StatCard
            icon="checkmark.circle.fill"
            label="Lessons"
            value={String(summary?.completedCount ?? 0)}
          />
        </View>

        {/* Menu */}
        <View className="px-5">
          <MenuRow
            icon="book.fill"
            label="Learning"
            detail={getLanguageName(selectedLanguageId)}
            onPress={() => router.push("/(tabs)/learn")}
          />
          <MenuRow
            icon="character.book.closed"
            label="Dictionary"
            onPress={() => router.push("/dictionary")}
          />
          <MenuRow
            icon="checkmark.shield.fill"
            label="Review Contributions"
            onPress={() => router.push("/review")}
          />
          <MenuRow
            icon="trophy.fill"
            label="Contributors"
            onPress={() => router.push("/contributors")}
          />
          <MenuRow
            icon="person.3.fill"
            label="Classroom"
            onPress={() => router.push("/classroom")}
          />
          <MenuRow
            icon="bell.fill"
            label="Notifications"
            onPress={() => router.push("/notifications")}
          />
          <MenuRow
            icon="gearshape.fill"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
          <View className="mt-4">
            <MenuRow
              icon="xmark"
              label="Sign Out"
              onPress={() => signOut()}
              danger
            />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
