import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SceneAssignSheet, type SceneOption } from "@/components/studio/scene-assign-sheet";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { fonts } from "@/constants/typography";
import {
    EducatorLesson,
    useEducatorCourses,
    useEducatorLessons,
    useUpdateEducatorLesson,
} from "@/lib/hooks/use-educator-panel";
import { useSaveEducatorLesson } from "@/lib/hooks/educator/use-lesson-save";

/** Scene columns ride the educator list response; older servers omit them. */
type SceneLesson = EducatorLesson & {
  scene?: string | null;
  sceneTitle?: string | null;
  sceneOrder?: number | null;
};
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

function LessonRow({
  lesson,
  onPress,
  onToggleActive,
  onAssignScene,
  onDrag,
  dragging,
  toggling,
}: Readonly<{
  lesson: SceneLesson;
  onPress: () => void;
  onToggleActive: () => void;
  onAssignScene: () => void;
  onDrag: () => void;
  dragging: boolean;
  toggling: boolean;
}>) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const isActive = lesson.isActive !== false;
  const title = localize(lesson.title, uiLanguage);
  const description = localize(lesson.description, uiLanguage);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDrag}
      delayLongPress={200}
      className="rounded-2xl border p-4 active:opacity-70"
      style={{ opacity: dragging ? 0.85 : 1, backgroundColor: M.card, borderColor: M.border }}
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
          <IconSymbol name="waveform" size={18} color={M.accent} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: M.text }}>{title}</Text>
          {description ? (
            <Text className="mt-0.5 text-sm" style={{ color: M.sub }} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
          <View className="mt-1.5 flex-row gap-2">
            {lesson.type ? (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: M.pillBg }}>
                <Text className="text-xs" style={{ color: M.sub }}>{lesson.type}</Text>
              </View>
            ) : null}
            {lesson.audioUrl ? (
              <View className="rounded-full bg-brand-50 px-2 py-0.5 dark:bg-brand-900/30">
                <Text className="text-xs font-semibold text-brand-500">Audio</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPressIn={onDrag}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="ml-2 p-1"
        >
          <IconSymbol name="line.3.horizontal" size={16} color={M.muted} />
        </Pressable>
        <IconSymbol name="chevron.right" size={16} color={M.muted} />
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t pt-3" style={{ borderColor: M.border }}>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleActive(); }}
          disabled={toggling}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
          style={{ backgroundColor: isActive ? M.successBg : M.pillBg }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            name={isActive ? "eye" : "eye.slash"}
            size={12}
            color={isActive ? M.success : M.muted}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: isActive ? M.success : M.muted }}
          >
            {toggling ? "…" : isActive ? "Active" : "Inactive"}
          </Text>
        </Pressable>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onAssignScene(); }}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
          style={{ backgroundColor: lesson.scene ? M.accentGlow : M.pillBg }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="square.grid.2x2" size={12} color={lesson.scene ? M.accent : M.muted} />
          <Text className="text-xs font-semibold" style={{ color: lesson.scene ? M.accent : M.muted }} numberOfLines={1}>
            {lesson.sceneTitle ?? lesson.scene ?? "Scene"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function EducatorLessonsScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { canAccess } = useStudioAccess();

  const { data: courses = [], refetch: refetchCourses } = useEducatorCourses(canAccess);
  const { data: lessons = [], refetch: refetchLessons } = useEducatorLessons(canAccess);
  const updateLesson = useUpdateEducatorLesson();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCourses(), refetchLessons()]);
    setRefreshing(false);
  }, [refetchCourses, refetchLessons]);

  const course = courses.find((c) => c.id === courseId);
  const courseLessons = useMemo(
    () => (lessons as SceneLesson[]).filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order),
    [lessons, courseId],
  );

  // Scene grouping (journey rendering): the course's scenes, derived from its
  // lessons' scene columns; assignment writes through the atomic lesson save.
  const saveLesson = useSaveEducatorLesson();
  const [sceneTarget, setSceneTarget] = useState<SceneLesson | null>(null);
  const courseScenes = useMemo<SceneOption[]>(() => {
    const byScene = new Map<string, SceneOption>();
    for (const l of courseLessons) {
      if (!l.scene) continue;
      const existing = byScene.get(l.scene);
      if (existing) {
        byScene.set(l.scene, { ...existing, lessonCount: existing.lessonCount + 1 });
      } else {
        byScene.set(l.scene, {
          scene: l.scene,
          sceneTitle: l.sceneTitle ?? null,
          sceneOrder: l.sceneOrder ?? null,
          lessonCount: 1,
        });
      }
    }
    return Array.from(byScene.values()).sort((a, b) => (a.sceneOrder ?? 999) - (b.sceneOrder ?? 999));
  }, [courseLessons]);
  const courseTitle = course ? localize(course.title, uiLanguage) : undefined;
  const courseDescription = course ? localize(course.description, uiLanguage) : "";

  // Local drag order, synced from the server list — DraggableFlatList needs a
  // controlled `data` array to animate reordering, separate from the
  // react-query cache it's derived from.
  const [dragOrder, setDragOrder] = useState<EducatorLesson[]>(courseLessons);
  useEffect(() => { setDragOrder(courseLessons); }, [courseLessons]);

  const handleDragEnd = ({ data }: { data: EducatorLesson[] }) => {
    setDragOrder(data);
    data.forEach((lesson, index) => {
      if (lesson.order !== index) {
        updateLesson.mutate({ id: lesson.id, payload: { order: index } });
      }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{ title: courseTitle ?? "Lessons", headerBackTitle: "Courses" }}
      />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <DraggableFlatList<EducatorLesson>
          data={dragOrder}
          keyExtractor={(lesson) => lesson.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
          renderItem={({ item: lesson, drag, isActive }: RenderItemParams<EducatorLesson>) => (
            <ScaleDecorator>
              <View className="px-5 py-1">
                <LessonRow
                  lesson={lesson}
                  onPress={() =>
                    router.push({
                      pathname: "/educator/lesson-edit",
                      params: { lessonId: lesson.id, courseId: lesson.courseId },
                    })
                  }
                  onAssignScene={() => setSceneTarget(lesson)}
                  onDrag={drag}
                  dragging={isActive}
                  onToggleActive={() =>
                    updateLesson.mutate(
                      { id: lesson.id, payload: { isActive: lesson.isActive === false } },
                      {
                        onSuccess: () =>
                          toastSuccess(
                            lesson.isActive === false ? "Lesson published" : "Lesson hidden",
                            localize(lesson.title, uiLanguage),
                          ),
                        onError: (err: Error) => toastError("Failed", err.message),
                      },
                    )
                  }
                  toggling={updateLesson.isPending && updateLesson.variables?.id === lesson.id}
                />
              </View>
            </ScaleDecorator>
          )}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View className="px-5 pt-4">
                <Text className="text-2xl" style={{ fontFamily: fonts.heading, color: M.text }}>
                  {courseTitle ?? "Lessons"}
                </Text>
                {courseDescription ? (
                  <Text className="mt-1 text-sm" style={{ color: M.sub }}>
                    {courseDescription}
                  </Text>
                ) : null}
                {course?.courseType ? (
                  <View className="mt-2 self-start rounded-full px-2.5 py-0.5" style={{ backgroundColor: M.pillBg }}>
                    <Text className="text-xs" style={{ color: M.sub }}>
                      {course.courseType}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* New Lesson CTA */}
              <View className="mt-4 px-5">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/educator/lesson-edit",
                      params: { courseId: courseId ?? "" },
                    })
                  }
                  className="flex-row items-center justify-center rounded-2xl bg-brand-500 py-3.5 active:opacity-80"
                >
                  <IconSymbol name="plus" size={16} color={M.parchment} />
                  <Text className="ml-2 text-sm font-semibold text-white">New Lesson</Text>
                </Pressable>
              </View>

              {/* Lesson List label */}
              <View className="mt-5 px-5">
                <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                  Lessons ({courseLessons.length})
                </Text>
                {courseLessons.length > 0 && (
                  <Text className="text-[11px]" style={{ color: M.muted }}>
                    Long-press and drag to reorder.
                  </Text>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <View className="mx-5 rounded-2xl border px-4 py-6" style={{ backgroundColor: M.card, borderColor: M.border }}>
              <Text className="text-center text-sm font-semibold" style={{ color: M.sub }}>
                No lessons yet in this course.
              </Text>
              <Text className="mt-1 text-center text-xs" style={{ color: M.muted }}>
                Tap &ldquo;New Lesson&rdquo; above to add the first one.
              </Text>
            </View>
          }
        />

        {sceneTarget && (
          <SceneAssignSheet
            visible
            lessonTitle={localize(sceneTarget.title, uiLanguage)}
            currentScene={sceneTarget.scene ?? null}
            scenes={courseScenes}
            onClose={() => setSceneTarget(null)}
            onCommit={(assignment) =>
              saveLesson.mutate(
                { id: sceneTarget.id, payload: assignment },
                {
                  onSuccess: () =>
                    toastSuccess(
                      assignment.scene ? "Scene assigned" : "Scene cleared",
                      assignment.sceneTitle ?? assignment.scene ?? localize(sceneTarget.title, uiLanguage),
                    ),
                  onError: (err: Error) => toastError("Scene failed", err.message),
                },
              )
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
