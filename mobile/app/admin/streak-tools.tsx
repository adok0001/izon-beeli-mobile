import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { FormField, FormInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { ApiError, apiFetch, friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

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
const SCENARIO_CONFIGS: Omit<Scenario, "label" | "detail">[] = [
  {
    key: "milestone-7",
    icon: "flame.fill",
    hue: "orange",
    body: { streak: 6, lastActive: "yesterday" },
  },
  {
    key: "milestone-14",
    icon: "flame.fill",
    hue: "orange",
    body: { streak: 13, lastActive: "yesterday" },
  },
  {
    key: "milestone-21",
    icon: "trophy.fill",
    hue: "amber",
    body: { streak: 20, lastActive: "yesterday" },
  },
  {
    key: "milestone-30",
    icon: "trophy.fill",
    hue: "amber",
    body: { streak: 29, lastActive: "yesterday" },
  },
  {
    key: "milestone-50",
    icon: "star.fill",
    hue: "teal",
    body: { streak: 49, lastActive: "yesterday" },
  },
  {
    key: "milestone-100",
    icon: "crown.fill",
    hue: "fuchsia",
    body: { streak: 99, lastActive: "yesterday" },
  },
  {
    key: "broken",
    icon: "exclamationmark.triangle.fill",
    hue: "rose",
    body: { streak: 10, lastActive: "stale" },
  },
  {
    key: "broken-with-freeze",
    icon: "snowflake",
    hue: "sky",
    body: { streak: 10, lastActive: "stale", freezes: 1 },
  },
  {
    key: "reset",
    icon: "arrow.counterclockwise",
    hue: "purple",
    body: { streak: 0, lastActive: "clear", freezes: 0 },
  },
];

function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  color,
  M,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  color: string;
  M: ReturnType<typeof useMuseumTheme>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: M.border,
        backgroundColor: M.card,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{ paddingHorizontal: 18, paddingVertical: 10 }}
        className="active:opacity-50"
      >
        <Text style={{ fontSize: 20, color: M.sub, lineHeight: 22 }}>−</Text>
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        keyboardType="number-pad"
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 18,
          fontWeight: "700",
          color: color,
          paddingVertical: 8,
        }}
        maxLength={4}
      />
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{ paddingHorizontal: 18, paddingVertical: 10 }}
        className="active:opacity-50"
      >
        <Text style={{ fontSize: 20, color: M.sub, lineHeight: 22 }}>+</Text>
      </Pressable>
    </View>
  );
}

export default function StreakToolsScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const lastActiveOptions: { value: LastActive; label: string }[] = [
    { value: "today", label: t("admin.streakTools.lastActive.today") },
    { value: "yesterday", label: t("admin.streakTools.lastActive.yesterday") },
    { value: "stale", label: t("admin.streakTools.lastActive.stale") },
    { value: "clear", label: t("admin.streakTools.lastActive.clear") },
  ];

  // Custom form state
  const [customStreak, setCustomStreak] = useState(0);
  const [customFreezes, setCustomFreezes] = useState(0);
  const [customLastActive, setCustomLastActive] = useState<LastActive>("yesterday");
  const [customUserId, setCustomUserId] = useState("");

  const scenarios: Scenario[] = [
    {
      ...SCENARIO_CONFIGS[0],
      label: t("admin.streakTools.scenarios.milestone7Label"),
      detail: t("admin.streakTools.scenarios.milestone7Detail"),
    },
    {
      ...SCENARIO_CONFIGS[1],
      label: t("admin.streakTools.scenarios.milestone14Label"),
      detail: t("admin.streakTools.scenarios.milestone14Detail"),
    },
    {
      ...SCENARIO_CONFIGS[2],
      label: t("admin.streakTools.scenarios.milestone21Label"),
      detail: t("admin.streakTools.scenarios.milestone21Detail"),
    },
    {
      ...SCENARIO_CONFIGS[3],
      label: t("admin.streakTools.scenarios.milestone30Label"),
      detail: t("admin.streakTools.scenarios.milestone30Detail"),
    },
    {
      ...SCENARIO_CONFIGS[4],
      label: t("admin.streakTools.scenarios.milestone50Label"),
      detail: t("admin.streakTools.scenarios.milestone50Detail"),
    },
    {
      ...SCENARIO_CONFIGS[5],
      label: t("admin.streakTools.scenarios.milestone100Label"),
      detail: t("admin.streakTools.scenarios.milestone100Detail"),
    },
    {
      ...SCENARIO_CONFIGS[6],
      label: t("admin.streakTools.scenarios.brokenLabel"),
      detail: t("admin.streakTools.scenarios.brokenDetail"),
    },
    {
      ...SCENARIO_CONFIGS[7],
      label: t("admin.streakTools.scenarios.brokenFreezeLabel"),
      detail: t("admin.streakTools.scenarios.brokenFreezeDetail"),
    },
    {
      ...SCENARIO_CONFIGS[8],
      label: t("admin.streakTools.scenarios.resetLabel"),
      detail: t("admin.streakTools.scenarios.resetDetail"),
    },
  ];

  async function apply(
    body: { streak: number; lastActive: LastActive; freezes?: number; userId?: string },
    key: string
  ) {
    setPendingKey(key);
    try {
      const token = await getToken();
      const result = await apiFetch<SetStreakResult>("/progress/admin/set-streak", {
        token: token ?? undefined,
        method: "POST",
        body: JSON.stringify(body),
      });
      await queryClient.invalidateQueries({ queryKey: ["progress"] });
      const message =
        result.lastActiveDate !== null
          ? t("admin.streakTools.successMessage", {
              streak: result.streak,
              freezeCount: result.freezeCount,
              lastActiveDate: result.lastActiveDate,
            })
          : t("admin.streakTools.successMessageCleared", {
              streak: result.streak,
              freezeCount: result.freezeCount,
            });
      Alert.alert(t("admin.streakTools.successTitle"), message);
    } catch (err) {
      // 404 almost always means the API build lacks this route (not deployed yet).
      const detail =
        err instanceof ApiError && err.status === 404
          ? t("admin.streakTools.errorNotFound")
          : friendlyError(err);
      Alert.alert(t("admin.streakTools.errorTitle"), detail);
    } finally {
      setPendingKey(null);
    }
  }

  const accentColor = getAccent("orange").solid;
  const applyButtonLabel = t("admin.streakTools.custom.applyButton");

  return (
    <>
      <Stack.Screen options={{ title: t("admin.streakTools.title") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader title={t("admin.streakTools.title")} subtitle={t("admin.streakTools.subtitle")} />

        <ScrollView
          style={{ flex: 1, backgroundColor: M.card }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Custom override ───────────────────────────────────────── */}
          <Text className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: M.muted }}>
            {t("admin.streakTools.custom.sectionTitle")}
          </Text>

          <StudioCard style={{ marginBottom: 8, gap: 16 }}>
            {/* Streak */}
            <FormField label={t("admin.streakTools.custom.streakLabel")}>
              <Stepper
                value={customStreak}
                onChange={setCustomStreak}
                color={accentColor}
                M={M}
              />
            </FormField>

            {/* Last active */}
            <FormField label={t("admin.streakTools.custom.lastActiveLabel")}>
              <StudioFilterPills
                options={lastActiveOptions.map(({ value, label }) => ({ id: value, label, color: accentColor }))}
                value={customLastActive}
                onChange={setCustomLastActive}
              />
            </FormField>

            {/* Freezes */}
            <FormField label={t("admin.streakTools.custom.freezesLabel")} hint={t("admin.streakTools.custom.freezesHint")}>
              <Stepper
                value={customFreezes}
                onChange={setCustomFreezes}
                color={getAccent("sky").solid}
                M={M}
              />
            </FormField>

            {/* User ID override */}
            <FormField label={t("admin.streakTools.custom.userIdLabel")} hint={t("admin.streakTools.custom.userIdHint")}>
              <FormInput
                value={customUserId}
                onChangeText={setCustomUserId}
                placeholder={t("admin.streakTools.custom.userIdPlaceholder")}
                autoCapitalize="none"
              />
            </FormField>

            {/* Apply button */}
            <PrimaryButton
              label={pendingKey === "custom" ? `${applyButtonLabel}…` : applyButtonLabel}
              disabled={pendingKey !== null}
              onPress={() =>
                apply(
                  {
                    streak: customStreak,
                    lastActive: customLastActive,
                    freezes: customFreezes,
                    ...(customUserId.trim() ? { userId: customUserId.trim() } : {}),
                  },
                  "custom"
                )
              }
            />
          </StudioCard>

          {/* ── Presets ───────────────────────────────────────────────── */}
          <Text className="text-xs font-semibold uppercase tracking-widest mt-8 mb-4" style={{ color: M.muted }}>
            {t("admin.streakTools.presets.sectionTitle")}
          </Text>

          <View style={{ gap: 10 }}>
            {scenarios.map((scenario) => {
              const color = getAccent(scenario.hue).solid;
              const busy = pendingKey === scenario.key;
              return (
                <Pressable
                  key={scenario.key}
                  onPress={() =>
                    apply(
                      {
                        ...scenario.body,
                        ...(customUserId.trim() ? { userId: customUserId.trim() } : {}),
                      },
                      scenario.key
                    )
                  }
                  disabled={pendingKey !== null}
                  style={{ opacity: pendingKey !== null && !busy ? 0.5 : 1 }}
                  className="active:opacity-70"
                >
                  <StudioCard accentColor={color} style={{ flexDirection: "row", alignItems: "center" }}>
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
                  </StudioCard>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
