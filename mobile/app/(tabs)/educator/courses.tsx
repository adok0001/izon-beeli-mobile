import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CourseCard, CourseEditModal } from "@/components/studio/course-editor";
import { CourseGeneratorPanel } from "@/components/studio/course-generator-panel";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { fonts } from "@/constants/typography";
import { localize } from "@/lib/localize";
import {
    EducatorCourse,
    useEducatorCourses,
    useToggleCourseActive,
    useUpdateEducatorCourse,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getLanguageName } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EducatorCoursesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { user: currentUser, canAccess } = useStudioAccess();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);

  const [editingCourse, setEditingCourse] = useState<EducatorCourse | null>(null);

  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const { data: courses = [] } = useEducatorCourses(canAccess);
  const toggleCourse = useToggleCourseActive();
  const updateCourse = useUpdateEducatorCourse();

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

  // Local drag order, synced from the server list — DraggableFlatList needs
  // a controlled `data` array to animate reordering, separate from the
  // react-query cache it's derived from.
  const [dragOrder, setDragOrder] = useState<EducatorCourse[]>(languageCourses);
  useEffect(() => { setDragOrder(languageCourses); }, [languageCourses]);

  const handleDragEnd = ({ data }: { data: EducatorCourse[] }) => {
    setDragOrder(data);
    data.forEach((course, index) => {
      if (course.order !== index) {
        updateCourse.mutate({ id: course.id, order: index });
      }
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Courses", headerBackTitle: "Back" }} />
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
        <DraggableFlatList<EducatorCourse>
          data={dragOrder}
          keyExtractor={(course) => course.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: course, drag, isActive }: RenderItemParams<EducatorCourse>) => (
            <ScaleDecorator>
              <View className="px-5 py-1">
                <CourseCard
                  course={course}
                  onPress={() => setEditingCourse(course)}
                  onDrag={drag}
                  dragging={isActive}
                  onToggleActive={() =>
                    toggleCourse.mutate(
                      { id: course.id, isActive: course.isActive === false },
                      {
                        onSuccess: () =>
                          toastSuccess(
                            course.isActive !== false ? "Course hidden" : "Course published",
                            localize(course.title, "en"),
                          ),
                        onError: (err: Error) => toastError("Failed", err.message),
                      },
                    )
                  }
                  toggling={toggleCourse.isPending && toggleCourse.variables?.id === course.id}
                />
              </View>
            </ScaleDecorator>
          )}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View className="px-5 pt-4">
                <Text className="text-2xl" style={{ fontFamily: fonts.heading, color: M.text }}>Courses</Text>
                <Text className="mt-1 text-sm" style={{ color: M.sub }}>
                  Select a language, manage its courses, then add lessons.
                </Text>
              </View>

              {/* Language Picker */}
              <View className="mt-4 px-5">
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
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs" style={{ color: M.muted }}>
                      {languageCourses.length} course{languageCourses.length === 1 ? "" : "s"}
                    </Text>
                    <IconSymbol name="chevron.right" size={14} color={M.muted} />
                  </View>
                </Pressable>
              </View>

              {/* Course List label */}
              <View className="mt-5 px-5">
                <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                  Courses ({languageCourses.length})
                </Text>
                {languageCourses.length > 0 && (
                  <Text className="text-[11px]" style={{ color: M.muted }}>
                    Long-press and drag to reorder.
                  </Text>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <View className="mx-5 mt-2 rounded-2xl border px-4 py-6" style={{ backgroundColor: M.card, borderColor: M.border }}>
              <Text className="text-center text-sm font-semibold" style={{ color: M.sub }}>
                No courses yet for {getLanguageName(activeLanguageId)}.
              </Text>
              <Text className="mt-1 text-center text-xs" style={{ color: M.muted }}>
                Use the actions below to generate a starter set.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View className="mt-5 px-5">
              <CourseGeneratorPanel
                activeLanguageId={activeLanguageId}
                languageCourses={languageCourses}
                onSuccess={toastSuccess}
                onError={toastError}
              />
            </View>
          }
        />

        <LanguagePickerModal
          visible={languagePickerVisible}
          selectedId={activeLanguageId}
          allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
          onSelect={(languageId) => {
            setSelectedLanguageId(languageId);
            setLanguagePickerVisible(false);
          }}
          onClose={() => setLanguagePickerVisible(false)}
        />

        {editingCourse && (
          <CourseEditModal
            course={editingCourse}
            visible
            saving={updateCourse.isPending}
            onClose={() => setEditingCourse(null)}
            onManageLessons={() => {
              const courseId = editingCourse.id;
              setEditingCourse(null);
              router.push({ pathname: "/educator/lessons", params: { courseId } });
            }}
            onSave={(fields) =>
              updateCourse.mutate(
                { id: editingCourse.id, ...fields },
                {
                  onSuccess: () => {
                    toastSuccess("Course updated", localize(editingCourse.title, "en"));
                    setEditingCourse(null);
                  },
                  onError: (err: Error) => toastError("Update failed", friendlyError(err)),
                },
              )
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
