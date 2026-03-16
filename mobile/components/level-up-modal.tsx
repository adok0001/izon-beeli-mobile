import { IconSymbol } from "@/components/ui/icon-symbol";
import { hapticHeavy } from "@/lib/haptics";
import { playFinishSound } from "@/lib/sounds";
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
          style={{ transform: [{ scale }], opacity }}
          className="mx-8 items-center rounded-3xl bg-white p-8 shadow-2xl dark:bg-neutral-900"
        >
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <IconSymbol name="star.fill" size={40} color="#f59e0b" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            {t("xp.levelUp")}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">
            {t("xp.levelLabel", { level })}
          </Text>
          <Text className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
            {title}
          </Text>
          <Text className="mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t("xp.levelUpEncouragement")}
          </Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
