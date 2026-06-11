import { AdinkraSymbolView } from "@/components/adinkra/adinkra-symbol";
import { animStyle as rise, useMountAnimation } from "@/components/learn/anim";
import { DailyGoalRing } from "@/components/learn/daily-goal-ring";
import { NotificationBell } from "@/components/notifications/notification-center";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { fonts, type } from "@/constants/typography";
import { ADINKRA_SYMBOLS } from "@/lib/data/adinkra";
import type { ProgressSummary } from "@/lib/hooks/use-progress";
import { getLanguageName } from "@/lib/mock-data";
import { bronze, glass, useMuseumTheme } from "@/lib/use-museum-theme";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, Text, View } from "react-native";

/** Daily-rotating Adinkra symbol — the embossed wall texture behind the greeting. */
function useDailyAdinkra() {
  return useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return ADINKRA_SYMBOLS[(dayOfYear % ADINKRA_SYMBOLS.length) - 1];
  }, []);
}

const overline = {
  fontFamily: fonts.headingMedium,
  fontSize: 9,
  letterSpacing: 1.8,
} as const;

const stripCell = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
} as const;

/**
 * "Exhibition placard" foyer header: gallery overline, greeting in the Museum
 * display face, a faint Adinkra watermark, bronze hairline rule, and a single
 * specimen strip holding the streak + daily-goal cells.
 */
export const LearnHeader = memo(function LearnHeader({
  summary,
  completedToday,
  selectedLanguageId,
  onStreakPress,
  onGoalPress,
}: {
  summary: ProgressSummary | undefined;
  completedToday: number;
  selectedLanguageId: string;
  onStreakPress: () => void;
  onGoalPress: () => void;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const symbol = useDailyAdinkra();
  const [labelAnim, greetingAnim, stripAnim] = useMountAnimation(3, 70);

  const firstName = user?.firstName ?? user?.username ?? "";
  const greeting = firstName
    ? t("learn.greeting", { name: firstName })
    : t("learn.greetingAnonymous");
  const streakActive = !summary?.streakBroken && summary?.refreshedToday !== false;

  return (
    <View
      style={{
        backgroundColor: M.ink,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        overflow: "hidden",
      }}
    >
      {/* Embossed Adinkra watermark — bleeds off the right edge behind the greeting */}
      {symbol && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: "absolute",
            right: -36,
            top: 48,
            opacity: greetingAnim,
            transform: [{ rotate: "-8deg" }],
          }}
        >
          <AdinkraSymbolView symbol={symbol} size={150} color={glass(0.05)} />
        </Animated.View>
      )}

      {/* Top row: gallery label + actions */}
      <View className="flex-row items-center justify-between">
        <Animated.Text style={[overline, { color: M.accent }, rise(labelAnim, 8)]}>
          {t("learn.galleryLabel").toUpperCase()} · {getLanguageName(selectedLanguageId).toUpperCase()}
        </Animated.Text>

        <View className="flex-row items-center gap-1.5">
          <NotificationBell />
          <Pressable
            onPress={() => router.push("/quiz")}
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: "center", justifyContent: "center",
              backgroundColor: bronze(0.15),
              borderWidth: 1, borderColor: bronze(0.3),
            }}
            accessibilityRole="button"
            accessibilityLabel="Practice quiz"
          >
            <IconSymbol name="graduationcap.fill" size={16} color={M.accent} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/dictionary")}
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: "center", justifyContent: "center",
              backgroundColor: glass(0.07),
              borderWidth: 1, borderColor: glass(0.1),
            }}
            accessibilityRole="button"
            accessibilityLabel="Dictionary"
          >
            <IconSymbol name="character.book.closed" size={16} color={M.textDim} />
          </Pressable>
        </View>
      </View>

      {/* Greeting placard */}
      <Animated.Text
        style={[type.display, { color: M.parchment, marginTop: 14 }, rise(greetingAnim, 12)]}
        numberOfLines={2}
      >
        {greeting}
      </Animated.Text>
      <Animated.Text
        style={[{ fontSize: 13, color: M.textDim, marginTop: 4 }, rise(greetingAnim, 10)]}
        numberOfLines={1}
      >
        {t("learn.subtitle")}
      </Animated.Text>

      {/* Bronze hairline rule with engraved leading segment */}
      <Animated.View
        style={[
          { marginTop: 18, flexDirection: "row", alignItems: "center" },
          { opacity: stripAnim },
        ]}
      >
        <View style={{ width: 24, height: 1.5, backgroundColor: M.accent }} />
        <View style={{ flex: 1, height: 1, backgroundColor: bronze(0.25) }} />
      </Animated.View>

      {/* Specimen strip: streak | daily goal */}
      <Animated.View
        style={[
          {
            marginTop: 12,
            flexDirection: "row",
            borderRadius: 12,
            backgroundColor: glass(0.05),
            borderWidth: 1,
            borderColor: glass(0.08),
            overflow: "hidden",
          },
          rise(stripAnim, 8),
        ]}
      >
        <Pressable
          onPress={onStreakPress}
          style={stripCell}
          accessibilityRole="button"
          accessibilityLabel={`${summary?.streakBroken ? "Broken streak" : "Streak"}: ${summary?.streak ?? 0} days`}
        >
          <IconSymbol
            name="flame.fill"
            size={15}
            color={streakActive ? getAccent("orange").solid : glass(0.2)}
          />
          <View>
            <Text style={[overline, { color: M.textDimDark }]}>STREAK</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: streakActive ? M.parchment : glass(0.25),
                textDecorationLine: summary?.streakBroken ? "line-through" : "none",
              }}
            >
              {summary?.streak ?? 0}d
            </Text>
          </View>
          {(summary?.freezeCount ?? 0) > 0 && (
            <View
              style={{
                marginLeft: "auto",
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 999,
                paddingHorizontal: 6,
                paddingVertical: 2,
                backgroundColor: M.infoBg,
                gap: 3,
              }}
            >
              <IconSymbol name="snowflake" size={9} color={M.info} />
              <Text style={{ fontSize: 10, fontWeight: "800", color: M.info }}>
                {summary!.freezeCount}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={{ width: 1, backgroundColor: glass(0.08) }} />

        <Pressable
          onPress={onGoalPress}
          style={stripCell}
          accessibilityRole="button"
          accessibilityLabel={`Daily goal: ${completedToday} of 3 challenges completed`}
          className="active:opacity-70"
        >
          <DailyGoalRing completedToday={completedToday} />
          <View>
            <Text style={[overline, { color: M.textDimDark }]}>DAILY GOAL</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: M.parchment }}>
              {completedToday}
              <Text style={{ fontSize: 12, fontWeight: "500", color: M.textDimDark }}>/3</Text>
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});
