import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SceneAssignSheet, type SceneOption } from "@/components/studio/scene-assign-sheet";
import { ActionPill, ActiveTogglePill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { useStudioAccess } from "@/components/studio/studio-gate";
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
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function LessonRow({
  lesson,
  onPress,
  onToggleActive,
  onAssignScene,
  reordering,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  moving,
  toggling,
}: Readonly<{
  lesson: SceneLesson;
  onPress: () => void;
  onToggleActive: () => void;
  onAssignScene: () => void;
  reordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  moving: boolean;
  toggling: boolean;
}>) {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const isActive = lesson.isActive !== false;
  const title = localize(lesson.title, uiLanguage);
  const description = localize(lesson.description, uiLanguage);
  return (
    <Pressable
      onPress={reordering ? undefined : onPress}
      className="rounded-2xl border p-4 active:opacity-70"
      style={{ backgroundColor: M.bg, borderColor: M.border }}
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
        {!reordering && <IconSymbol name="chevron.right" size={16} color={M.muted} />}
      </View>
      {reordering ? (
        <View className="mt-3 flex-row items-center gap-2 border-t pt-3" style={{ borderColor: M.border }}>
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp || moving}
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
              borderRadius: 999, paddingVertical: 9, borderWidth: 1,
              backgroundColor: M.pillBg, borderColor: M.border,
              opacity: !canMoveUp || moving ? 0.4 : 1,
            }}
            className="active:opacity-70"
          >
            <IconSymbol name="chevron.up" size={13} color={M.text} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>Move Up</Text>
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown || moving}
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
              borderRadius: 999, paddingVertical: 9, borderWidth: 1,
              backgroundColor: M.pillBg, borderColor: M.border,
              opacity: !canMoveDown || moving ? 0.4 : 1,
            }}
            className="active:opacity-70"
          >
            <IconSymbol name="chevron.down" size={13} color={M.text} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: M.text }}>Move Down</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-3 flex-row items-center justify-between border-t pt-3" style={{ borderColor: M.border }}>
          <ActiveTogglePill active={isActive} pending={toggling} onPress={onToggleActive} />
          <ActionPill
            icon="square.grid.2x2"
            label={lesson.sceneTitle ?? lesson.scene ?? "Scene"}
            tone="accent"
            active={!!lesson.scene}
            onPress={onAssignScene}
          />
        </View>
      )}
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
  const [reorderMode, setReorderMode] = useState(false);
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

  // Reordering swaps the two lessons' `order` values directly — courseLessons
  // re-sorts once the mutation invalidates the list, no local drag state needed.
  const handleMove = (index: number, direction: -1 | 1) => {
    const target = courseLessons[index];
    const neighbor = courseLessons[index + direction];
    if (!target || !neighbor) return;
    updateLesson.mutate({ id: target.id, payload: { order: neighbor.order } });
    updateLesson.mutate({ id: neighbor.id, payload: { order: target.order } });
  };

  return (
    <>
      <Stack.Screen
        options={{ title: courseTitle ?? "Lessons", headerBackTitle: "Courses" }}
      />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <StudioScreenHeader
          title={courseTitle ?? "Lessons"}
          subtitle={courseDescription || undefined}
          action={{
            label: "New Lesson",
            icon: "plus",
            onPress: () =>
              router.push({
                pathname: "/educator/lesson-edit",
                params: { courseId: courseId ?? "" },
              }),
          }}
        />
        <FlatList<SceneLesson>
          data={courseLessons}
          keyExtractor={(lesson) => lesson.id}
          style={{ flex: 1, backgroundColor: M.card }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
          renderItem={({ item: lesson, index }) => (
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
                reordering={reorderMode}
                onMoveUp={() => handleMove(index, -1)}
                onMoveDown={() => handleMove(index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < courseLessons.length - 1}
                moving={updateLesson.isPending}
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
          )}
          ListHeaderComponent={
            <>
              {course?.courseType ? (
                <View className="px-5 pt-4">
                  <View className="self-start rounded-full px-2.5 py-0.5" style={{ backgroundColor: M.pillBg }}>
                    <Text className="text-xs" style={{ color: M.sub }}>
                      {course.courseType}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Lesson List label */}
              <View className="mt-5 flex-row items-center justify-between px-5">
                <View>
                  <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                    Lessons ({courseLessons.length})
                  </Text>
                  {reorderMode && (
                    <Text className="text-[11px]" style={{ color: M.muted }}>
                      Tap Move Up / Move Down on a lesson to reorder it.
                    </Text>
                  )}
                </View>
                {courseLessons.length > 0 && (
                  <Pressable
                    onPress={() => setReorderMode((v) => !v)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
                      backgroundColor: reorderMode ? `${M.accent}20` : M.pillBg,
                      borderWidth: 1, borderColor: reorderMode ? `${M.accent}50` : M.border,
                    }}
                    className="active:opacity-70"
                  >
                    <IconSymbol
                      name={reorderMode ? "checkmark" : "arrow.up.arrow.down"}
                      size={12}
                      color={reorderMode ? M.accent : M.sub}
                    />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: reorderMode ? M.accent : M.sub }}>
                      {reorderMode ? "Done" : "Reorder"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <View className="mx-5 mt-4">
              <StudioCard>
                <Text className="text-center text-sm font-semibold" style={{ color: M.sub }}>
                  No lessons yet in this course.
                </Text>
                <Text className="mt-1 text-center text-xs" style={{ color: M.muted }}>
                  Tap &ldquo;New Lesson&rdquo; above to add the first one.
                </Text>
              </StudioCard>
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
