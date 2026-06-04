import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticHeavy } from "@/lib/haptics";
import { playFinishSound } from "@/lib/sounds";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Modal, Pressable, Text, View } from "react-native";

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  title: string;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, level, title, onDismiss }: LevelUpModalProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      playFinishSound().catch(() => {});
      hapticHeavy();
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    } else {
      scale.setValue(0.5);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable
        onPress={onDismiss}
        className="flex-1 items-center justify-center bg-black/50"
      >
        <Animated.View
          style={[
            { transform: [{ scale }], opacity },
            { marginHorizontal: 32, alignItems: "center", borderRadius: 24, backgroundColor: M.card, padding: 32, borderWidth: 1, borderColor: M.border }
          ]}
        >
          <View style={{ marginBottom: 16, height: 80, width: 80, alignItems: "center", justifyContent: "center", borderRadius: 40, backgroundColor: `${M.accent}20`, borderWidth: 1, borderColor: `${M.accent}40` }}>
            <IconSymbol name="star.fill" size={40} color={M.accent} />
          </View>
          <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase", color: M.accent }}>
            {t("xp.levelUp")}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 30, fontWeight: "700", color: M.text }}>
            {t("xp.levelLabel", { level })}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 18, fontWeight: "600", color: M.accent }}>
            {title}
          </Text>
          <Text style={{ marginTop: 12, textAlign: "center", fontSize: 14, color: M.sub }}>
            {t("xp.levelUpEncouragement")}
          </Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
