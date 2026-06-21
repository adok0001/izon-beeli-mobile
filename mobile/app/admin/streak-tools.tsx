import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { ApiError, apiFetch, friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LastActive = "today" | "yesterday" | "stale" | "clear";

interface SetStreakResult {
  streak: number;
  lastActiveDate: string | null;
  freezeCount: number;
}

interface Scenario {
  key: string;
  icon: string;
  label: string;
  detail: string;
  hue: AccentHue;
  body: { streak: number; lastActive: LastActive; freezes?: number };
}

// Each preset maps to the server's set-streak knobs. "yesterday" leaves the
// streak primed so the next lesson increments it; "stale" simulates a missed
// day (the broken-streak path); "clear" wipes lastActiveDate entirely.
const SCENARIOS: Scenario[] = [
  {
    key: "milestone-7",
    icon: "flame.fill",
    label: "Prime 7-day milestone",
    detail: "Streak 6 + active yesterday → next lesson hits 7",
    hue: "orange",
    body: { streak: 6, lastActive: "yesterday" },
  },
  {
    key: "milestone-30",
    icon: "trophy.fill",
    label: "Prime 30-day milestone",
    detail: "Streak 29 + active yesterday → next lesson hits 30",
    hue: "amber",
    body: { streak: 29, lastActive: "yesterday" },
  },
  {
    key: "broken",
    icon: "exclamationmark.triangle.fill",
    label: "Break the streak",
    detail: "Streak 10, last active 3 days ago → broken-streak UI",
    hue: "rose",
    body: { streak: 10, lastActive: "stale" },
  },
  {
    key: "broken-with-freeze",
    icon: "snowflake",
    label: "Break streak + grant freeze",
    detail: "Broken streak with 1 freeze available to spend",
    hue: "sky",
    body: { streak: 10, lastActive: "stale", freezes: 1 },
  },
  {
    key: "reset",
    icon: "arrow.counterclockwise",
    label: "Reset to zero",
    detail: "Streak 0, freezes 0, last active cleared",
    hue: "purple",
    body: { streak: 0, lastActive: "clear", freezes: 0 },
  },
];

export default function StreakToolsScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function applyScenario(scenario: Scenario) {
    setPendingKey(scenario.key);
    try {
      const token = await getToken();
      const result = await apiFetch<SetStreakResult>("/progress/admin/set-streak", {
        token: token ?? undefined,
        method: "POST",
        body: JSON.stringify(scenario.body),
      });
      await queryClient.invalidateQueries({ queryKey: ["progress"] });
      Alert.alert(
        "Streak updated",
        `Streak ${result.streak} · freezes ${result.freezeCount} · last active ${result.lastActiveDate ?? "cleared"}.`
      );
    } catch (err) {
      // 404 here almost always means the API build lacks this route (not deployed),
      // which is the exact failure that masquerades as an auth error — call it out.
      // Everything else defers to the shared friendlyError mapping.
      const detail =
        err instanceof ApiError && err.status === 404
          ? "Endpoint not found — this build of the API may not be deployed yet."
          : friendlyError(err);
      Alert.alert("Could not update streak", detail);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Streak Tools" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            Streak Tools
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Override your own streak to test milestones, the celebration modal, and the
            broken-streak / freeze flows without waiting real days.
          </Text>

          <View style={{ gap: 10 }}>
            {SCENARIOS.map((scenario) => {
              const color = getAccent(scenario.hue).solid;
              const busy = pendingKey === scenario.key;
              return (
                <Pressable
                  key={scenario.key}
                  onPress={() => applyScenario(scenario)}
                  disabled={pendingKey !== null}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    backgroundColor: M.card,
                    borderWidth: 1,
                    borderColor: M.border,
                    borderLeftWidth: 4,
                    borderLeftColor: color,
                    opacity: pendingKey !== null && !busy ? 0.5 : 1,
                  }}
                  className="active:opacity-70"
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${color}15`,
                      marginRight: 12,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={color} />
                    ) : (
                      <IconSymbol name={scenario.icon as never} size={18} color={color} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>
                      {scenario.label}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>
                      {scenario.detail}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
