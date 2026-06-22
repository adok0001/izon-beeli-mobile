import { ShareModal } from "@/components/share/share-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { fonts, type } from "@/constants/typography";
import { hapticHeavy } from "@/lib/haptics";
import { playFinishSound } from "@/lib/sounds";
import { bronze, glass, MUSEUM } from "@/lib/use-museum-theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  streak: number;
  isMilestone?: boolean;
  onDismiss: () => void;
}

const BACKDROP_COLORS = [MUSEUM.inkRaised, MUSEUM.ink, MUSEUM.inkDeep] as const;
const CTA_COLORS = [MUSEUM.accentLight, MUSEUM.accent, MUSEUM.accentDark] as const;

/** Decorative sparkles scattered around the flame — purely ambient. */
const SPARKLES = [
  { top: "14%", left: "18%", size: 10, color: glass(0.5) },
  { top: "10%", right: "22%", size: 14, color: bronze(0.7) },
  { top: "30%", right: "14%", size: 8, color: glass(0.35) },
  { top: "34%", left: "12%", size: 12, color: bronze(0.5) },
  { top: "46%", right: "20%", size: 9, color: glass(0.4) },
] as const;

/**
 * Full-screen streak celebration — Beeli's take on the milestone moment. Rather
 * than confetti, the streak is staged like a backlit gallery specimen: a glowing
 * bronze flame, the count as the hero in the Museum display face, and a two-tier
 * CTA that nudges sharing before letting the learner continue.
 */
export function StreakCelebrationModal({ visible, streak, isMilestone, onDismiss }: Props) {
  const { t } = useTranslation();
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (visible && !shareVisible) {
      playFinishSound().catch(() => {});
      hapticHeavy();
    }
  }, [visible, shareVisible]);

  return (
    <>
      <Modal
        visible={visible && !shareVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={onDismiss}
      >
        <LinearGradient colors={BACKDROP_COLORS} style={{ flex: 1 }}>
          {/* Radial bronze glow behind the flame */}
          <View pointerEvents="none" style={styles.ambientGlow} />

          {/* Ambient sparkles */}
          {SPARKLES.map((s, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(200 + i * 90).duration(500)}
              pointerEvents="none"
              style={{ position: "absolute", ...s }}
            >
              <Ionicons name="sparkles" size={s.size} color={s.color} />
            </Animated.View>
          ))}

          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <View style={styles.content}>
              {isMilestone && (
                <Animated.Text
                  entering={FadeInUp.delay(80)}
                  style={[type.overline, { color: MUSEUM.accent, marginBottom: 24 }]}
                >
                  {t("streakCelebration.milestoneOverline").toUpperCase()}
                </Animated.Text>
              )}

              <Animated.View entering={ZoomIn.springify().damping(13)} style={styles.flameRing}>
                <View pointerEvents="none" style={styles.flameInnerGlow} />
                <IconSymbol name="flame.fill" size={56} color={getAccent("orange").solid} />
              </Animated.View>

              <Animated.Text entering={ZoomIn.delay(120).springify().damping(15)} style={styles.number}>
                {streak}
              </Animated.Text>

              <Animated.Text entering={FadeInUp.delay(220)} style={styles.label}>
                {t("streakCelebration.dayStreak")}
              </Animated.Text>

              <Animated.Text entering={FadeInUp.delay(300)} style={styles.subtitle}>
                {isMilestone
                  ? t("streakCelebration.milestoneBody")
                  : t("streakCelebration.body")}
              </Animated.Text>
            </View>

            {/* Two-tier CTA: share loudly, continue quietly */}
            <Animated.View entering={FadeInUp.delay(380)} style={styles.ctaWrap}>
              <Pressable
                onPress={() => setShareVisible(true)}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel={t("streakCelebration.shareCta")}
              >
                <LinearGradient
                  colors={CTA_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cta}
                >
                  <Ionicons name="share-outline" size={19} color={MUSEUM.ink} />
                  <Text style={styles.ctaLabel}>{t("streakCelebration.shareCta")}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onDismiss}
                hitSlop={8}
                style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={t("streakCelebration.continue")}
              >
                <Text style={styles.continueLabel}>{t("streakCelebration.continue")}</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>

      <ShareModal
        visible={shareVisible}
        onClose={() => {
          setShareVisible(false);
          onDismiss();
        }}
        data={{ template: "streak", streak, isMilestone }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  ambientGlow: {
    position: "absolute",
    top: "22%",
    alignSelf: "center",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: bronze(0.1),
  },
  flameRing: {
    height: 116,
    width: 116,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 58,
    backgroundColor: bronze(0.16),
    borderWidth: 1,
    borderColor: bronze(0.4),
  },
  flameInnerGlow: {
    position: "absolute",
    height: 150,
    width: 150,
    borderRadius: 75,
    backgroundColor: bronze(0.16),
  },
  number: {
    fontFamily: fonts.heading,
    fontSize: 96,
    lineHeight: 104,
    letterSpacing: -2,
    color: MUSEUM.parchment,
    marginTop: 20,
  },
  label: {
    ...type.h3,
    color: MUSEUM.accent,
    letterSpacing: 1,
  },
  subtitle: {
    ...type.body,
    color: MUSEUM.textDim,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 12,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
  },
  ctaLabel: { fontFamily: fonts.heading, fontSize: 16, color: MUSEUM.ink },
  continueBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  continueLabel: { fontFamily: fonts.headingMedium, fontSize: 15, color: MUSEUM.textDim },
});
