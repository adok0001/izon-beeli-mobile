import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguageStore } from "@/store/language-store";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLanguageName } from "@/lib/mock-data";
import { useThemeStore } from "@/store/theme-store";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center border-b border-neutral-100 py-4 active:opacity-70 dark:border-neutral-800"
    >
      <IconSymbol name={icon as any} size={20} color="#6b7280" />
      <Text className="ml-3 flex-1 text-base text-neutral-900 dark:text-white">
        {label}
      </Text>
      {value && (
        <Text className="mr-2 text-sm text-neutral-500 dark:text-neutral-400">
          {value}
        </Text>
      )}
      {onPress && (
        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
      )}
    </Pressable>
  );
}

const THEME_OPTIONS = ["system", "light", "dark"] as const;
const THEME_LABELS: Record<string, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { preference, setPreference } = useThemeStore();
  const { getToken } = useAuth();

  const handleResetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset all your learning progress? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await apiFetch("/progress", {
                method: "DELETE",
                token: token ?? undefined,
              });
              Alert.alert("Done", "Your progress has been reset.");
            } catch {
              Alert.alert("Error", "Failed to reset progress. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        <View className="px-5 pt-4">
          {/* Learning section */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Learning
          </Text>
          <SettingsRow
            icon="book.fill"
            label="Current Language"
            value={getLanguageName(selectedLanguageId)}
          />
          <SettingsRow
            icon="flame.fill"
            label="Daily Streak"
            value={`${summary?.streak ?? 0} days`}
          />
          <SettingsRow
            icon="star.fill"
            label="Points Earned"
            value={String(summary?.points ?? 0)}
          />

          {/* App section */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            App
          </Text>
          <Text className="mb-1 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Appearance
          </Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setPreference(opt)}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  preference === opt
                    ? "bg-blue-500"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    preference === opt
                      ? "text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {THEME_LABELS[opt]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Danger zone */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Data
          </Text>
          <Pressable
            onPress={handleResetProgress}
            className="flex-row items-center border-b border-neutral-100 py-4 active:opacity-70 dark:border-neutral-800"
          >
            <IconSymbol name="xmark" size={20} color="#ef4444" />
            <Text className="ml-3 text-base font-semibold text-red-500">
              Reset Progress
            </Text>
          </Pressable>

          {/* App info */}
          <View className="mt-8 items-center">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              Izon Beeli
            </Text>
            <Text className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
