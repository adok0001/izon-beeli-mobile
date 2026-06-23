import { AdinkraSymbolView } from "@/components/adinkra/adinkra-symbol";
import { EnrolledLanguageBar } from "@/components/language-picker";
import { animStyle as rise, useMountAnimation } from "@/components/learn/anim";
import { DailyGoalRing } from "@/components/learn/daily-goal-ring";
import { NotificationBell } from "@/components/notifications/notification-center";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { fonts } from "@/constants/typography";
import { ADINKRA_SYMBOLS } from "@/lib/data/adinkra";
import type { ProgressSummary } from "@/lib/hooks/use-progress";
import { pathLevelLabel } from "@/lib/journey";
import { getLanguageName } from "@/lib/mock-data";
import { bronze, glass, useMuseumTheme } from "@/lib/use-museum-theme";
import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ReactNode, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Image, Pressable, Text, View } from "react-native";

/** Daily-rotating Adinkra symbol — the embossed wall texture behind the greeting. */
function useDailyAdinkra() {
  return useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return ADINKRA_SYMBOLS[dayOfYear % ADINKRA_SYMBOLS.length];
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
  paddingHorizontal: 11,
  paddingVertical: 11,
} as const;

/** 30px tinted medallion — the recurring "specimen disc" used across the strip. */
function Medallion({ bg, border, children }: { bg: string; border: string; children: ReactNode }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: border,
      }}
    >
      {children}
    </View>
  );
}

/** One cell of the specimen strip: medallion + overline label + value. */
function StatCell({
  medallion,
  label,
  value,
  onPress,
  a11y,
}: {
  medallion: ReactNode;
  label: string;
  value: ReactNode;
  onPress?: () => void;
  a11y: string;
}) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        stripCell,
        {
          borderRadius: 14,
          backgroundColor: "rgba(8,9,15,0.55)",
          borderWidth: 1,
          borderColor: bronze(0.28),
        },
      ]}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={a11y}
    >
      {medallion}
      <View>
        <Text style={[overline, { color: M.textDimDark }]}>{label}</Text>
        {value}
      </View>
    </Pressable>
  );
}

/** Profile avatar — image if Clerk has one, otherwise the first initial. */
function Avatar({ imageUrl, initial }: { imageUrl?: string | null; initial: string }) {
  const purple = getAccent("purple");
  return (
    <View
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: purple.bg,
        borderWidth: 1,
        borderColor: purple.border,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ color: purple.solid, fontWeight: "800", fontSize: 20 }}>{initial}</Text>
      )}
    </View>
  );
}

/** Overall path-completion bar — sits in the gradient's fade into the map. */
function ParcoursBar({ done, total, anim }: { done: number; total: number; anim: Animated.Value }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Animated.View style={[{ marginTop: 16 }, rise(anim, 8)]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 7,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: M.textDim }}>
          {t("learn.pathTitle", { defaultValue: "Path" })} ·{" "}
          {t("learn.lessonsCount", { done, total, defaultValue: `${done}/${total} lessons` })}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "800", color: M.accent }}>{pct} %</Text>
      </View>
      <View style={{ height: 6, borderRadius: 999, backgroundColor: glass(0.16), overflow: "hidden" }}>
        <View
          style={{ height: "100%", width: `${pct}%`, borderRadius: 999, backgroundColor: M.accent }}
        />
      </View>
    </Animated.View>
  );
}

/**
 * Foyer header: profile avatar, gallery overline + greeting, quick actions, the
 * Série/Objectif/Niveau specimen strip, the active language+region pill, and the
 * overall Parcours bar. The dark surface fades to parchment at the bottom so it
 * melts into the light journey map below.
 */
export const LearnHeader = memo(function LearnHeader({
  summary,
  completedToday,
  selectedLanguageId,
  pathDone,
  pathTotal,
  onStreakPress,
  onGoalPress,
}: {
  summary: ProgressSummary | undefined;
  completedToday: number;
  selectedLanguageId: string;
  pathDone: number;
  pathTotal: number;
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
  const initial = (firstName || "?").slice(0, 1).toUpperCase();
  const streakActive = !summary?.streakBroken && summary?.refreshedToday !== false;
  const flame = getAccent("orange");
  const pct = pathTotal > 0 ? (pathDone / pathTotal) * 100 : 0;
  const level = pathLevelLabel(pct);

  return (
    <LinearGradient
      colors={[M.ink, M.ink, "#15161F", "#4A4436", M.bg]}
      locations={[0, 0.58, 0.78, 0.93, 1]}
      style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, overflow: "hidden" }}
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
            top: 40,
            opacity: greetingAnim,
            transform: [{ rotate: "-8deg" }],
          }}
        >
          <AdinkraSymbolView symbol={symbol} size={140} color={glass(0.05)} />
        </Animated.View>
      )}

      {/* Top row: avatar · gallery overline + greeting · actions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Animated.View style={rise(labelAnim, 8)}>
          <Avatar imageUrl={user?.imageUrl} initial={initial} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Animated.Text style={[overline, { color: M.accent }, rise(labelAnim, 8)]} numberOfLines={1}>
            {t("learn.galleryLabel").toUpperCase()} · {getLanguageName(selectedLanguageId).toUpperCase()}
          </Animated.Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignSelf: "flex-start" }}>
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
            accessibilityLabel={t("learn.practiceQuiz")}
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

      {/* Specimen strip — three separate cards: Série · Objectif · Niveau */}
      <Animated.View
        style={[{ marginTop: 16, flexDirection: "row", gap: 8 }, rise(stripAnim, 8)]}
      >
        <StatCell
          onPress={onStreakPress}
          a11y={`${summary?.streakBroken ? "Broken streak" : "Streak"}: ${summary?.streak ?? 0} days`}
          medallion={
            <Medallion bg={flame.bg} border={streakActive ? flame.border : glass(0.15)}>
              <IconSymbol name="flame.fill" size={14} color={streakActive ? flame.solid : glass(0.2)} />
            </Medallion>
          }
          label={t("learn.streak").toUpperCase()}
          value={
            <Text
              style={{
                fontSize: 16, fontWeight: "800",
                color: streakActive ? M.parchment : glass(0.25),
                textDecorationLine: summary?.streakBroken ? "line-through" : "none",
              }}
            >
              {summary?.streak ?? 0}
              {t("learn.dayShort", { defaultValue: "d" })}
            </Text>
          }
        />
        <StatCell
          onPress={onGoalPress}
          a11y={`Daily goal: ${completedToday} of 3 challenges completed`}
          medallion={<DailyGoalRing completedToday={completedToday} />}
          label={t("learn.dailyGoal").toUpperCase()}
          value={
            <Text style={{ fontSize: 16, fontWeight: "800", color: M.parchment }}>
              {completedToday}
              <Text style={{ fontSize: 12, fontWeight: "500", color: M.textDimDark }}>/3</Text>
            </Text>
          }
        />
        <StatCell
          a11y={`Level: ${level}`}
          medallion={
            <Medallion bg={bronze(0.16)} border={M.accent}>
              <IconSymbol name="star.fill" size={13} color={M.accent} />
            </Medallion>
          }
          label={t("learn.level").toUpperCase()}
          value={<Text style={{ fontSize: 16, fontWeight: "800", color: M.parchment }}>{level}</Text>}
        />
      </Animated.View>

      {/* Active language + region pill (opens the language picker) */}
      <EnrolledLanguageBar />

      {/* Overall Parcours progress, fading into the map */}
      <ParcoursBar done={pathDone} total={pathTotal} anim={stripAnim} />
    </LinearGradient>
  );
});
