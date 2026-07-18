import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { EntityPickerModal, type PickerItem } from "@/components/studio/entity-picker-modal";
import { SceneEditSheet } from "@/components/studio/scene-edit-sheet";
import type { SceneOption } from "@/components/studio/scene-assign-sheet";
import { SCENE_KIND_LABELS } from "@/components/studio/scene-illustration-picker";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEducatorCourses, useEducatorLessons } from "@/lib/hooks/use-educator-panel";
import { useDeleteScene, useUpdateScene } from "@/lib/hooks/educator/use-scenes";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { getLanguageName } from "@/lib/mock-data";
import { deriveScenes, type SceneSourceLesson } from "@/lib/studio/derive-scenes";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SceneLesson = SceneSourceLesson & { id: string; courseId: string };

export default function EducatorScenesScreen() {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { user: currentUser, canAccess } = useStudioAccess();
  const { data: courses = [], refetch: refetchCourses } = useEducatorCourses(canAccess);
  const { data: lessons = [], refetch: refetchLessons } = useEducatorLessons(canAccess);
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const updateScene = useUpdateScene();
  const deleteScene = useDeleteScene();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [editing, setEditing] = useState<SceneOption | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    if (currentUser.isAdmin) return Array.from(new Set(courses.map((c) => c.languageId)));
    return currentUser.reviewerLanguages;
  }, [currentUser, courses]);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const languageCourses = useMemo(
    () => courses.filter((c) => c.languageId === activeLanguageId).sort((a, b) => a.order - b.order),
    [courses, activeLanguageId],
  );

  const courseId = languageCourses.some((c) => c.id === selectedCourseId)
    ? selectedCourseId!
    : (languageCourses[0]?.id ?? "");
  const activeCourse = languageCourses.find((c) => c.id === courseId);

  const courseItems: PickerItem[] = languageCourses.map((c) => ({ id: c.id, label: localize(c.title, uiLanguage) }));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCourses(), refetchLessons()]);
    setRefreshing(false);
  };

  const courseLessons = useMemo(
    () => (lessons as SceneLesson[]).filter((l) => l.courseId === courseId),
    [lessons, courseId],
  );
  const scenes = useMemo(() => deriveScenes(courseLessons), [courseLessons]);

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = scenes[index];
    const neighbor = scenes[index + direction];
    if (!target || !neighbor) return;
    updateScene.mutate({ courseId, scene: target.scene, sceneOrder: neighbor.sceneOrder });
    updateScene.mutate({ courseId, scene: neighbor.scene, sceneOrder: target.sceneOrder });
  };

  const handleSave = (fields: { sceneTitle: string; sceneIllustration: string; sceneIllustrationUrl: string | null }) => {
    if (!editing) return;
    updateScene.mutate(
      { courseId, scene: editing.scene, ...fields },
      {
        onSuccess: () => {
          toastSuccess("Scene updated", fields.sceneTitle);
          setEditing(null);
        },
        onError: (err: Error) => toastError("Update failed", err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!editing) return;
    const target = editing;
    Alert.alert(
      "Delete scene",
      `This ungroups every lesson in "${target.sceneTitle ?? target.scene}" (${target.lessonCount} lesson${target.lessonCount === 1 ? "" : "s"}). Lessons themselves are not deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteScene.mutate(
              { courseId, scene: target.scene },
              {
                onSuccess: () => {
                  toastSuccess("Scene deleted", target.sceneTitle ?? target.scene);
                  setEditing(null);
                },
                onError: (err: Error) => toastError("Delete failed", err.message),
              },
            ),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Scenes" }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <StudioScreenHeader title="Scenes" subtitle="Manage lesson groupings and their background art" />

        <View className="px-5 pb-3" style={{ gap: 10 }}>
          <View>
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
              Language
            </Text>
            <Pressable
              onPress={() => setLanguagePickerVisible(true)}
              className="flex-row items-center justify-between rounded-xl border px-3 py-2.5"
              style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder }}
            >
              <View className="flex-row items-center">
                <IconSymbol name="book.fill" size={16} color={M.accent} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: M.text }}>
                  {getLanguageName(activeLanguageId)}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={M.muted} />
            </Pressable>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
              Course
            </Text>
            <Pressable
              onPress={() => setCoursePickerVisible(true)}
              disabled={languageCourses.length === 0}
              className="flex-row items-center justify-between rounded-xl border px-3 py-2.5"
              style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, opacity: languageCourses.length === 0 ? 0.5 : 1 }}
            >
              <Text className="flex-1 text-sm font-semibold" numberOfLines={1} style={{ color: M.text }}>
                {activeCourse ? localize(activeCourse.title, uiLanguage) : "No courses in this language"}
              </Text>
              <IconSymbol name="chevron.right" size={14} color={M.muted} />
            </Pressable>
          </View>
        </View>

        <FlatList<SceneOption>
          data={scenes}
          keyExtractor={(s) => s.scene}
          style={{ flex: 1, backgroundColor: M.card }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
          renderItem={({ item, index }) => (
            <View className="px-5 py-1">
              <StudioCard>
                <Text className="text-base font-semibold" style={{ color: M.text }}>{item.sceneTitle ?? item.scene}</Text>
                <Text className="mt-0.5 text-xs" style={{ color: M.muted }}>
                  {item.scene} · {item.lessonCount} lesson{item.lessonCount === 1 ? "" : "s"}
                  {item.sceneIllustrationUrl
                    ? " · Custom SVG"
                    : item.sceneIllustration
                      ? ` · ${SCENE_KIND_LABELS[item.sceneIllustration as keyof typeof SCENE_KIND_LABELS] ?? item.sceneIllustration}`
                      : ""}
                </Text>
                <View className="mt-3 flex-row items-center gap-2 border-t pt-3" style={{ borderColor: M.border }}>
                  <ActionPill icon="chevron.up" label="Up" onPress={() => handleMove(index, -1)} disabled={index === 0} />
                  <ActionPill icon="chevron.down" label="Down" onPress={() => handleMove(index, 1)} disabled={index === scenes.length - 1} />
                  <ActionPill icon="pencil" label="Edit" tone="accent" onPress={() => setEditing(item)} />
                </View>
              </StudioCard>
            </View>
          )}
          ListEmptyComponent={
            <View className="mx-5 mt-4">
              <StudioCard>
                <Text className="text-center text-sm font-semibold" style={{ color: M.sub }}>
                  No scenes in this course yet.
                </Text>
                <Text className="mt-1 text-center text-xs" style={{ color: M.muted }}>
                  Assign a lesson to a scene from its lesson list to create one.
                </Text>
              </StudioCard>
            </View>
          }
        />

        <SceneEditSheet
          visible={!!editing}
          scene={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={updateScene.isPending}
          deleting={deleteScene.isPending}
        />

        <LanguagePickerModal
          visible={languagePickerVisible}
          selectedId={activeLanguageId}
          allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
          onSelect={(languageId) => {
            setSelectedLanguageId(languageId);
            setSelectedCourseId(undefined);
            setLanguagePickerVisible(false);
          }}
          onClose={() => setLanguagePickerVisible(false)}
        />

        <EntityPickerModal
          visible={coursePickerVisible}
          title="Select course"
          items={courseItems}
          selectedId={courseId}
          onSelect={(id) => {
            setSelectedCourseId(id);
            setCoursePickerVisible(false);
          }}
          onClose={() => setCoursePickerVisible(false)}
        />
      </SafeAreaView>
    </>
  );
}
