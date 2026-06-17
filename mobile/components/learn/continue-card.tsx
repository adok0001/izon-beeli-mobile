import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLesson } from "@/lib/hooks/use-courses";
import { localize } from "@/lib/localize";
import { BUNDLED_AUDIO } from "@/lib/mock-data";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, Text, View } from "react-native";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { animStyle } from "./anim";

/** "Continue listening" resume card for the last partially-played lesson. */
export const ContinueCard = memo(function ContinueCard({
  lessonId,
  positionSeconds,
}: {
  lessonId: string;
  positionSeconds: number;
}) {
  const M = useMuseumTheme();
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
        await loadAndPlay(lessonId, audioSource, localize(lesson.title, uiLanguage), `/lesson/${lessonId}`);
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
          borderLeftColor: M.success,
          backgroundColor: M.successBg,
          borderWidth: 1,
          borderColor: M.successBorder,
        }}
        className="mb-3 p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Continue listening: ${localize(lesson.title, uiLanguage)}, paused at ${posLabel}`}
        accessibilityHint="Tap to resume playback"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: M.success, borderRadius: 12 }}
            className="mr-3 h-12 w-12 items-center justify-center"
          >
            <IconSymbol name="play.fill" size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text style={{ color: M.success, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }}>
              {t("learn.continueListening").toUpperCase()}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
              {localize(lesson.title, uiLanguage)}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("learn.pausedAt", { time: posLabel })}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={M.success} />
        </View>
      </Pressable>
    </Animated.View>
  );
});
