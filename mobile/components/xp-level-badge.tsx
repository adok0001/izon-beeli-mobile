import { getLevelInfo } from "@/lib/xp-levels";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface XpLevelBadgeProps {
  points: number;
  variant?: "compact" | "full";
}

export function XpLevelBadge({ points, variant = "compact" }: XpLevelBadgeProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const info = getLevelInfo(points);
  const translatedTitle = info.legendNumeral
    ? t("xp.levels.legendNumeral", { numeral: info.legendNumeral })
    : t(`xp.levels.${info.titleKey}` as any);

  if (variant === "compact") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ borderRadius: 999, backgroundColor: M.accent, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.ink }}>{t("xp.levelShort", { level: info.level })}</Text>
        </View>
        <View style={{ height: 6, width: 64, overflow: "hidden", borderRadius: 999, backgroundColor: M.border }}>
          <View
            style={{ height: "100%", borderRadius: 999, backgroundColor: M.accent, width: `${Math.round(info.progress * 100)}%` }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{
        marginBottom: 8, height: 64, width: 64, alignItems: "center", justifyContent: "center",
        borderRadius: 32, borderWidth: 3, borderColor: M.accent, backgroundColor: M.accentGlow,
      }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: M.accent }}>
          {info.level}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>
        {translatedTitle}
      </Text>
      <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>
        {t("xp.progressLabel", { current: info.currentXP, needed: info.xpForNextLevel })}
      </Text>
      <View style={{ marginTop: 8, height: 8, width: 192, overflow: "hidden", borderRadius: 999, backgroundColor: M.border }}>
        <View
          style={{ height: "100%", borderRadius: 999, backgroundColor: M.accent, width: `${Math.round(info.progress * 100)}%` }}
        />
      </View>
      <Text style={{ marginTop: 4, fontSize: 12, color: M.muted }}>
        {t("xp.totalXP", { total: info.totalXP })}
      </Text>
    </View>
  );
}
