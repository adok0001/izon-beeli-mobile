import { fonts, type } from "@/constants/typography";
import { hapticTap } from "@/lib/haptics";
import { useWordAudio } from "@/lib/hooks/use-word-audio";
import { buildShareMessage, captureAndShare, type ShareCardData } from "@/lib/share-card";
import { bronze, glass, MUSEUM } from "@/lib/use-museum-theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareCardPreview } from "./share-card-preview";

interface Props {
  visible: boolean;
  onClose: () => void;
  data: ShareCardData;
}

const BACKDROP_COLORS = ["#12141F", MUSEUM.ink, MUSEUM.inkDeep] as const;
const CTA_COLORS = [MUSEUM.accentLight, MUSEUM.accent, MUSEUM.accentDark] as const;

export function ShareModal({ visible, onClose, data }: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const { play, stop } = useWordAudio();

  // Words always speak (recorded clip or TTS fallback); proverbs only when recorded.
  const canListen =
    data.template === "word" || (data.template === "proverb" && !!data.audioUrl);

  const handleListen = () => {
    hapticTap();
    if (data.template === "word") {
      play(data.audioUrl, data.word);
    } else if (data.template === "proverb") {
      play(data.audioUrl);
    }
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const handleShare = async () => {
    hapticTap();
    stop();
    setSharing(true);
    await captureAndShare(cardRef, buildShareMessage(data, t));
    setSharing(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient colors={BACKDROP_COLORS} style={{ flex: 1 }}>
        {/* Ambient bronze glow behind the card */}
        <View pointerEvents="none" style={styles.ambientGlow} />

        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          {/* Liquid-glass header */}
          <BlurView intensity={30} tint="dark" style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={MUSEUM.parchment} />
            </Pressable>
            <Text style={{ ...type.title, color: MUSEUM.parchment }}>{t("share.cardTitle")}</Text>
            <View style={{ width: 34 }} />
          </BlurView>

          {/* Floating card */}
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.cardShadow}>
              <ShareCardPreview ref={cardRef} {...data} />
            </Animated.View>

            {canListen && (
              <Animated.View entering={FadeInUp.delay(120)}>
                <Pressable
                  onPress={handleListen}
                  hitSlop={8}
                  style={({ pressed }) => [styles.listenPill, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={t("share.listen")}
                >
                  <Ionicons name="volume-high" size={15} color={MUSEUM.accent} />
                  <Text style={styles.listenLabel}>{t("share.listen")}</Text>
                </Pressable>
              </Animated.View>
            )}

            <Animated.Text entering={FadeInUp.delay(150)} style={styles.hint}>
              {t("share.tapToSend")}
            </Animated.Text>
          </View>

          {/* Primary CTA */}
          <Animated.View entering={FadeInUp.delay(100)} className="px-6 pb-3">
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={({ pressed }) => ({
                opacity: sharing ? 0.6 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={CTA_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cta}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={MUSEUM.ink} />
                ) : (
                  <Ionicons name="share-outline" size={19} color={MUSEUM.ink} />
                )}
                <Text style={styles.ctaLabel}>{t("share.shareButton")}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ambientGlow: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: bronze(0.1),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: glass(0.08),
  },
  closeButton: {
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: glass(0.08),
    borderWidth: 1,
    borderColor: glass(0.12),
  },
  cardShadow: {
    shadowColor: MUSEUM.accent,
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  listenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: glass(0.08),
    borderWidth: 1,
    borderColor: bronze(0.35),
  },
  listenLabel: { fontFamily: fonts.headingMedium, fontSize: 13, color: MUSEUM.accent },
  hint: { ...type.caption, color: MUSEUM.textDimDark, marginTop: 16, textAlign: "center" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
  },
  ctaLabel: { fontFamily: fonts.heading, fontSize: 16, color: MUSEUM.ink },
});
