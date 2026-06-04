import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNextLesson } from "@/lib/hooks/use-next-lesson";
import { localizeField } from "@/lib/localize";
import { formatDuration } from "@/lib/mock-data";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, Text, View } from "react-native";


export function UpNextCard({ languageId }: { languageId?: string }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data, isLoading } = useNextLesson(languageId);

  const anim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!data) return;
    const { overallProgress } = data;
    const pct =
      overallProgress.total > 0
        ? (overallProgress.completed / overallProgress.total) * 100
        : 0;
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [data]);

  if (isLoading || !data?.lesson || !data?.course) return null;

  const { lesson, course, overallProgress } = data;
  const progressPct =
    overallProgress.total > 0
      ? Math.round((overallProgress.completed / overallProgress.total) * 100)
      : 0;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => router.push(`/lesson/${lesson.id}`)}
        style={{
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.accentBorder,
          borderLeftWidth: 4,
          borderLeftColor: M.accent,
        }}
        className="active:opacity-75"
        accessibilityRole="button"
        accessibilityLabel={`Up next: ${localizeField(lesson.title, lesson.titleFr, uiLanguage)}, ${progressPct}% complete`}
        accessibilityHint="Tap to begin this lesson"
      >
        {/* Main row: play button + lesson info */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 12 }}>
          <View
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: "center", justifyContent: "center",
              backgroundColor: M.accent, flexShrink: 0,
            }}
          >
            <IconSymbol name="play.fill" size={13} color={M.ink} />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: M.accent }} />
              <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 1.8, color: M.accent, textTransform: "uppercase" }}>
                {t("learn.upNext")}
              </Text>
              <Text style={{ fontSize: 8, fontWeight: "600", letterSpacing: 1, color: M.muted, textTransform: "uppercase" }}>
                · {localizeField(course.title, course.titleFr, uiLanguage)}
              </Text>
            </View>
            <Text
              style={{ fontSize: 15, fontWeight: "800", color: M.text, letterSpacing: -0.3, lineHeight: 20 }}
              numberOfLines={1}
            >
              {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
            </Text>
          </View>

          {lesson.duration ? (
            <Text style={{ fontSize: 11, color: M.muted, flexShrink: 0 }}>
              {formatDuration(lesson.duration)}
            </Text>
          ) : (
            <IconSymbol name="chevron.right" size={14} color={M.accent} />
          )}
        </View>

        {/* Progress bar footer */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 10,
            gap: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 0.8, color: M.muted }}>
              {overallProgress.completed}/{overallProgress.total} lessons
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: M.accent }}>
              {progressPct}%
            </Text>
          </View>
          <View style={{ height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <Animated.View
              style={{
                height: 2,
                borderRadius: 1,
                backgroundColor: M.accent,
                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              }}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
