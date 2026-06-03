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
          borderRadius: 18,
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
        {/* Header label */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: M.accent,
                }}
              />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  letterSpacing: 2,
                  color: M.accent,
                  textTransform: "uppercase",
                }}
              >
                {t("learn.upNext")}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 1.2,
                color: M.muted,
                textTransform: "uppercase",
              }}
            >
              {localizeField(course.title, course.titleFr, uiLanguage)}
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: M.text,
              letterSpacing: -0.4,
              lineHeight: 28,
            }}
            numberOfLines={2}
          >
            {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
          </Text>
          {lesson.description ? (
            <Text
              style={{ fontSize: 13, color: M.sub, marginTop: 5, lineHeight: 18 }}
              numberOfLines={2}
            >
              {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
            </Text>
          ) : null}

          {/* Progress + duration row */}
          <View style={{ marginTop: 14 }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1, color: M.muted }}>
                YOUR PATH · {overallProgress.completed}/{overallProgress.total}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "700", color: M.accent }}>
                {progressPct}%
              </Text>
            </View>
            <View
              style={{
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: M.accent,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>
          </View>
        </View>

        {/* CTA footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
            backgroundColor: M.accentGlow,
          }}
        >
          <View className="flex-row items-center gap-2">
            <View
              style={{
                width: 32, height: 32, borderRadius: 16,
                alignItems: "center", justifyContent: "center",
                backgroundColor: M.accent,
              }}
            >
              <IconSymbol name="play.fill" size={14} color={M.ink} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.accent }}>
              {t("learn.upNext")}
            </Text>
          </View>
          {lesson.duration ? (
            <Text style={{ fontSize: 12, color: M.muted }}>
              {formatDuration(lesson.duration)}
            </Text>
          ) : (
            <IconSymbol name="chevron.right" size={16} color={M.accent} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
