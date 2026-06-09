import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLesson } from "@/lib/hooks/use-courses";
import { localizeField } from "@/lib/localize";
import { BUNDLED_AUDIO } from "@/lib/mock-data";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, Text, View } from "react-native";
import { animStyle } from "./anim";

/** "Continue listening" resume card for the last partially-played lesson. */
export const ContinueCard = memo(function ContinueCard({
  lessonId,
  positionSeconds,
}: {
  lessonId: string;
  positionSeconds: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lesson } = useLesson(lessonId);
  const { loadAndPlay, seekTo, currentTrackId } = useAudioStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  if (!lesson) return null;

  const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];
  const mins = Math.floor(positionSeconds / 60);
  const secs = Math.floor(positionSeconds % 60);
  const posLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const handleResume = async () => {
    if (audioSource) {
      if (currentTrackId !== lessonId) {
        await loadAndPlay(lessonId, audioSource, lesson.title);
        await seekTo(positionSeconds);
      } else {
        await seekTo(positionSeconds);
      }
    }
    router.push(`/lesson/${lessonId}`);
  };

  return (
    <Animated.View style={animStyle(anim)}>
      <Pressable
        onPress={handleResume}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          borderLeftWidth: 4,
          borderLeftColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.06)",
          borderWidth: 1,
          borderColor: "rgba(74, 222, 128, 0.15)",
        }}
        className="mb-3 p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Continue listening: ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}, paused at ${posLabel}`}
        accessibilityHint="Tap to resume playback"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: "#22c55e", borderRadius: 12 }}
            className="mr-3 h-12 w-12 items-center justify-center"
          >
            <IconSymbol name="play.fill" size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text style={{ color: "#4ade80", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }}>
              {t("learn.continueListening").toUpperCase()}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
              {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("learn.pausedAt", { time: posLabel })}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="#22c55e" />
        </View>
      </Pressable>
    </Animated.View>
  );
});
