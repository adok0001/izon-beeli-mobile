import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { getCourseTypeColors, getLevelColors } from "@/constants/course-colors";
import { useCourseLessons } from "@/lib/hooks/use-courses";
import { localizeField } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { Course } from "@/types";
import { type Href, useRouter } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Animated, Pressable, Text, View } from "react-native";
import { animStyle } from "./anim";
import { LessonRow } from "./lesson-row";

/** Expandable course card: progress bar, lesson list, and quiz/match/story actions. */
export const CourseCard = memo(function CourseCard({
  course,
  completedIds,
  hasStoryArc,
  index,
}: {
  course: Course;
  completedIds: Set<string>;
  hasStoryArc: boolean;
  index: number;
}) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course.id);
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const [collapsed, setCollapsed] = useState(false);
  const typeColors = getCourseTypeColors(course.courseType);
  const levelColors = getLevelColors(course.level);
  const anim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay: index * 90,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!collapsed) {
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 700,
        delay: index * 90 + 200,
        useNativeDriver: false,
      }).start();
    }
  }, [collapsed, progressPercent]);

  const accentColor = typeColors.tickActive ?? M.accent;
  const purple = getAccent("purple");
  const amber = getAccent("amber");

  return (
    <Animated.View style={[{ marginBottom: 16 }, animStyle(anim, 24)]}>
      <View
        style={{
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.borderDark,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        }}
      >
        {/* Header */}
        <Pressable
          onPress={() => setCollapsed((c) => !c)}
          className="p-4 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={`${localizeField(course.title, course.titleFr, uiLanguage)}, ${completedCount} of ${lessons.length} lessons completed`}
          accessibilityHint={collapsed ? "Tap to expand course" : "Tap to collapse course"}
          accessibilityState={{ expanded: !collapsed }}
        >
          {/* Top row: level badge + count */}
          <View className="mb-2.5 flex-row items-center justify-between">
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: `${accentColor}20`,
                borderWidth: 1,
                borderColor: `${accentColor}40`,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  color: accentColor,
                }}
              >
                {t(`levels.${course.level}`, { defaultValue: course.level })}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 11, color: M.textDimDark }}>
                {completedCount}/{lessons.length}
              </Text>
              <IconSymbol
                name={collapsed ? "chevron.right" : "chevron.down"}
                size={12}
                color={M.textDimDark}
              />
            </View>
          </View>

          {/* Title */}
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: M.text, letterSpacing: -0.3, marginBottom: 4 }}
          >
            {localizeField(course.title, course.titleFr, uiLanguage)}
          </Text>
          <Text style={{ fontSize: 13, color: M.textDim, lineHeight: 18 }} numberOfLines={2}>
            {localizeField(course.description, course.descriptionFr, uiLanguage)}
          </Text>

          {/* Course type badge */}
          {course.courseType && typeColors.label ? (
            <View
              style={{
                marginTop: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: `${accentColor}18`,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: accentColor }}>
                {typeColors.label}
              </Text>
            </View>
          ) : null}

          {/* Progress bar */}
          {progressPercent > 0 && (
            <View style={{ marginTop: 14 }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: accentColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              </View>
              {progressPercent >= 100 && (
                <Text style={{ marginTop: 4, fontSize: 10, fontWeight: "700", color: M.success, textAlign: "right" }}>
                  {t("learn.complete")}
                </Text>
              )}
            </View>
          )}
        </Pressable>

        {/* Lessons + Actions */}
        {!collapsed && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {lessonsLoading ? (
              <ActivityIndicator size="small" color={accentColor} style={{ paddingVertical: 12 }} />
            ) : (
              lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  completed={completedIds.has(lesson.id)}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              ))
            )}

            {/* Action buttons */}
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => router.push({ pathname: "/quiz", params: { courseId: course.id } })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}10`,
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.practiceQuiz")}
              >
                <IconSymbol name="lightbulb.fill" size={14} color={accentColor} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: accentColor }}>
                  {t("learn.practiceQuiz")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push({ pathname: "/matching-game", params: { courseId: course.id } })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: purple.border,
                  backgroundColor: purple.bg,
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.matchingGame")}
              >
                <IconSymbol name="rectangle.grid.2x2" size={14} color={purple.solid} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: purple.solid }}>
                  {t("learn.matchingGame")}
                </Text>
              </Pressable>
            </View>

            {hasStoryArc && (
              <Pressable
                onPress={() => router.push(`/story/${course.id}` as Href)}
                style={{
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: amber.border,
                  backgroundColor: amber.bg,
                  gap: 6,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={t("learn.storyMode")}
              >
                <IconSymbol name="book.fill" size={14} color={amber.solid} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: amber.solid }}>
                  {t("learn.storyMode")}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
});
