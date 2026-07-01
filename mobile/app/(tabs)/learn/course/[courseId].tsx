import { JourneyMap } from "@/components/learn/journey-map";
import { CourseArtwork } from "@/components/learn/course-artwork";
import { UpNextTeaser } from "@/components/learn/up-next-teaser";
import { LoadingScreen } from "@/components/loading-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { fonts } from "@/constants/typography";
import { isRemoteAudioSource } from "@/lib/downloads";
import { useCourseLessons, useCourses } from "@/lib/hooks/use-courses";
import { usePlusGate } from "@/lib/hooks/use-plus-gate";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { courseProgress, courseUnitNumber, nextCourse } from "@/lib/journey";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDownloadsStore } from "@/store/downloads-store";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseTreeScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const { data: allCourses = [], refetch: refetchCourses } = useCourses(selectedLanguageId);
  const { data: lessons = [], isLoading: lessonsLoading, refetch: refetchLessons } = useCourseLessons(courseId);
  const { data: completedLessonIds, isLoading: progressLoading, refetch: refetchProgress } = useCompletedLessons();

  const completedIds = useMemo(() => new Set(completedLessonIds ?? []), [completedLessonIds]);

  const course = allCourses.find((c) => c.id === courseId) ?? null;
  const unitNumber = course ? courseUnitNumber(allCourses, courseId) : 1;
  const next = course ? nextCourse(allCourses, courseId) : null;
  const progress = useMemo(() => courseProgress(lessons, completedIds, courseId), [lessons, completedIds, courseId]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCourses(), refetchLessons(), refetchProgress()]);
    setRefreshing(false);
  }, [refetchCourses, refetchLessons, refetchProgress]);

  const isLoading = lessonsLoading || progressLoading;

  const { isPlus, showPaywall } = usePlusGate();
  const downloadCourse = useDownloadsStore((s) => s.downloadCourse);
  const downloadableLessons = useMemo(
    () => lessons.filter((l) => isRemoteAudioSource(l.audioUrl)),
    [lessons]
  );

  const handleDownloadAll = () => {
    if (!isPlus) {
      showPaywall();
      return;
    }
    if (downloadableLessons.length === 0) return;
    Alert.alert(
      t("downloads.downloadAllConfirmTitle"),
      t("downloads.downloadAllConfirmMessage", { count: downloadableLessons.length }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("downloads.downloadAll"),
          onPress: () =>
            downloadCourse(
              downloadableLessons.map((l) => ({
                lessonId: l.id,
                courseId: l.courseId,
                title: l.title,
                courseTitle: course?.title,
                remoteUrl: l.audioUrl as string,
              }))
            ),
        },
      ]
    );
  };

  const upNextTeaser = next ? (
    <UpNextTeaser
      nextCourse={next}
      onPress={() => router.push({ pathname: "/learn/course/[courseId]", params: { courseId: next.id } })}
    />
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Back bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: M.ink,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: M.accent }}>
            {t("learn.unitN", { n: unitNumber, defaultValue: "Unit {{n}}" }).toUpperCase()}
          </Text>
          <Text
            style={{ fontFamily: fonts.heading, fontSize: 16, color: M.parchment, marginTop: 1 }}
            numberOfLines={1}
          >
            {course ? localize(course.title, uiLanguage) : ""}
          </Text>
        </View>
        {downloadableLessons.length > 0 ? (
          <Pressable
            onPress={handleDownloadAll}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("downloads.downloadAll")}
          >
            <IconSymbol name="arrow.down.circle" size={20} color={M.accent} />
          </Pressable>
        ) : null}
        <Text style={{ fontSize: 13, fontWeight: "700", color: M.accent }}>
          {progress.percent}%
        </Text>
      </View>

      {/* Unit artwork strip */}
      {course && (
        <View style={{ height: 100, overflow: "hidden" }}>
          <CourseArtwork course={course} size="hero" />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              backgroundColor: M.ink,
              opacity: 0.6,
            }}
          />
        </View>
      )}

      {/* Lesson tree */}
      {isLoading ? (
        <View style={{ flex: 1, backgroundColor: M.bg }}>
          <LoadingScreen />
        </View>
      ) : (
        <JourneyMap
          courses={course ? [course] : []}
          lessons={lessons}
          completedIds={completedIds}
          refreshing={refreshing}
          onRefresh={onRefresh}
          accent={M.accent}
          showStartBubble
          footer={upNextTeaser}
        />
      )}
    </SafeAreaView>
  );
}
