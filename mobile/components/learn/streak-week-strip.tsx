import { Pressable, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { weekStreakDays } from "@/lib/journey";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import type { ProgressSummary } from "@/lib/hooks/use-progress";

const DAY_KEYS = ["learn.weekdaySun", "learn.weekdayMon", "learn.weekdayTue", "learn.weekdayWed", "learn.weekdayThu", "learn.weekdayFri", "learn.weekdaySat"] as const;

interface StreakWeekStripProps {
  summary: ProgressSummary | undefined;
  onPress?: () => void;
}

export function StreakWeekStrip({ summary, onPress }: StreakWeekStripProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const today = new Date().getDay();

  const days = weekStreakDays(
    summary?.streak ?? 0,
    summary?.refreshedToday ?? false,
    summary?.streakBroken ?? false
  );

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        padding: 16,
      }}
      accessibilityRole="button"
      accessibilityLabel={t("learn.streakDays", { count: summary?.streak ?? 0, defaultValue: "{{count}} day streak" })}
    >
      <Text
        style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, color: M.muted, marginBottom: 10, textAlign: "center" }}
      >
        {t("learn.currentStreak", { defaultValue: "Current Streak" }).toUpperCase()}: {summary?.streak ?? 0} {t("learn.dayShort", { defaultValue: "d" }).toUpperCase()}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {days.map((active, i) => {
          const isToday = i === today;
          return (
            <View key={i} style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: M.muted, letterSpacing: 0.5 }}>
                {t(DAY_KEYS[i], { defaultValue: ["S","M","T","W","T","F","S"][i] }).charAt(0)}
              </Text>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? (isToday ? "transparent" : `${M.accent}33`) : `${M.border}66`,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: isToday ? M.accent : "transparent",
                }}
              >
                {isToday ? (
                  <IconSymbol
                    name="flame.fill"
                    size={16}
                    color={(summary?.streakBroken && !summary?.refreshedToday) ? M.muted : M.accent}
                  />
                ) : (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: active ? M.accent : M.border,
                    }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
