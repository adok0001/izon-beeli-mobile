import { friendlyError } from "@/lib/api";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DueDatePicker } from "@/components/ui/due-date-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useClassroomGroups, useCreateAssignment, useAssignStoryArc } from "@/lib/hooks/use-classroom";
import { useCourses, useLanguageLessons } from "@/lib/hooks/use-courses";
import { useStoryArcs, useStoryArc } from "@/lib/hooks/use-story-arc";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDuration } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/types";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getAccent } from "@/constants/accent-colors";

type Tab = "lessons" | "story";

// Story arc selector — shows arcs available for this group's language
function StoryArcTab({
  languageId,
  groupId,
  dueDate,
  onSuccess,
  onError,
}: {
  languageId: string;
  groupId: string;
  dueDate: Date | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const M = useMuseumTheme();
  const M = useMuseumTheme();
  const { data: courses = [] } = useCourses(languageId);
  const { data: allArcs = [], isLoading: arcsLoading } = useStoryArcs();
  const assignStoryArc = useAssignStoryArc();
  const [selectedArcCourseId, setSelectedArcCourseId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Full arc data for the selected arc's course
  const { data: selectedArcDetail, isLoading: arcDetailLoading } = useStoryArc(
    selectedArcCourseId ?? ""
  );

  const courseIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses]);
  const languageArcs = useMemo(
    () => allArcs.filter((a) => courseIds.has(a.courseId)),
    [allArcs, courseIds]
  );

  const handleAssign = async () => {
    if (!selectedArcDetail) return;
    const lessonIds = selectedArcDetail.chapters
      .sort((a, b) => a.order - b.order)
      .map((ch) => ch.lessonId);

    setAssigning(true);
    try {
      await assignStoryArc.mutateAsync({
        groupId,
        lessonIds,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      });
      onSuccess();
    } catch (e) {
      onError(friendlyError(e as Error));
    } finally {
      setAssigning(false);
    }
  };

  if (arcsLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (languageArcs.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <IconSymbol name="book.closed.fill" size={48} color={M.border} />
        <Text className="mt-4 text-center text-base font-semibold text-neutral-500 dark:text-neutral-400">
          No story arcs available
        </Text>
        <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
          Ask an educator to create story arcs for this language's courses.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={languageArcs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedArcCourseId === item.courseId;
          return (
            <Pressable
              onPress={() =>
                setSelectedArcCourseId(isSelected ? null : item.courseId)
              }
              className={`mb-3 rounded-xl border-2 p-4 ${
                isSelected
                  ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20"
                  : "border-neutral-200 dark:border-neutral-700"
              }`}
            >
              <View className="flex-row items-center">
                <IconSymbol
                  name={isSelected ? "checkmark.circle.fill" : "book.closed.fill"}
                  size={22}
                  color={isSelected ? getAccent("amber").solid : M.border}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* Show chapter list when selected */}
              {isSelected && (
                <View className="mt-3">
                  {arcDetailLoading ? (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  ) : selectedArcDetail ? (
                    <>
                      <Text className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedArcDetail.description}
                      </Text>
                      {[...selectedArcDetail.chapters]
                        .sort((a, b) => a.order - b.order)
                        .map((ch, i) => (
                          <View
                            key={ch.id}
                            className="mb-1 flex-row items-center gap-2"
                          >
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                              <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                {i + 1}
                              </Text>
                            </View>
                            <Text className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">
                              {ch.title}
                            </Text>
                          </View>
                        ))}
                      <Text className="mt-2 text-xs text-neutral-400">
                        {selectedArcDetail.chapters.length} lesson
                        {selectedArcDetail.chapters.length !== 1 ? "s" : ""} will
                        be assigned
                      </Text>
                    </>
                  ) : null}
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {selectedArcCourseId && (
        <View className="border-t border-neutral-200 px-5 pb-6 pt-3 dark:border-neutral-700">
          <Pressable
            onPress={handleAssign}
            disabled={assigning || arcDetailLoading}
            className="items-center rounded-xl bg-amber-500 py-4 active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-base font-bold text-white">
              {assigning ? "Assigning…" : "Assign story arc"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function AssignLessonScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: groups = [] } = useClassroomGroups();
  const group = groups.find((g) => g.id === groupId);
  const createAssignment = useCreateAssignment();
  const [selected, setSelected] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("lessons");
  const { toast, error: toastError, dismiss: dismissToast } = useToast();

  const { data: allLessons = [], isLoading } = useLanguageLessons(group?.languageId ?? "");

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-neutral-500">Group not found</Text>
        </View>
      </>
    );
  }

  const handleAssignLesson = () => {
    if (!selected) return;
    createAssignment.mutate(
      {
        groupId,
        lessonId: selected,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => toastError("Error", friendlyError(err)),
      }
    );
  };

  const canAssignLesson = tab === "lessons" && !!selected && !createAssignment.isPending;
  const assigningLesson = tab === "lessons" && createAssignment.isPending;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Pressable onPress={() => router.back()}>
            <Text className="text-base text-neutral-500">{t("classroom.cancel")}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {tab === "lessons" ? t("classroom.assignLesson") : "Assign Story Arc"}
          </Text>
          {tab === "lessons" ? (
            <Pressable onPress={handleAssignLesson} disabled={!canAssignLesson}>
              <Text
                className={`text-base font-semibold ${
                  canAssignLesson
                    ? "text-blue-500"
                    : "text-neutral-300 dark:text-neutral-600"
                }`}
              >
                {assigningLesson ? t("classroom.assigning") : t("classroom.assign")}
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Tab switcher */}
        <View className="flex-row border-b border-neutral-100 px-5 dark:border-neutral-800">
          {(["lessons", "story"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="mr-5 py-3"
            >
              <Text
                className={`text-sm font-semibold ${
                  tab === t
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {t === "lessons" ? "Lessons" : "Story Arc"}
              </Text>
              {tab === t && (
                <View className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-500" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Due date picker — shared across both tabs */}
        <View className="border-b border-neutral-100 px-5 pt-4 dark:border-neutral-800">
          <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("classroom.dueDate")}
          </Text>
          <DueDatePicker value={dueDate} onChange={setDueDate} />
        </View>

        {/* Tab content */}
        {tab === "lessons" ? (
          isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={getAccent("blue").solid} />
            </View>
          ) : (
            <FlatList
              data={allLessons}
              keyExtractor={(item) => item.id}
              contentContainerClassName="px-5 pb-8 pt-4"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: Lesson }) => (
                <Pressable
                  onPress={() => setSelected(item.id)}
                  className={`mb-2 flex-row items-center rounded-xl border-2 p-3 ${
                    selected === item.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <IconSymbol
                    name={selected === item.id ? "checkmark.circle.fill" : "circle"}
                    size={20}
                    color={selected === item.id ? getAccent("blue").solid : M.border}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                  {item.duration && (
                    <Text className="text-xs text-neutral-400">
                      {formatDuration(item.duration)}
                    </Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="py-8 text-center text-neutral-400">
                  {t("classroom.noLessons")}
                </Text>
              }
            />
          )
        ) : (
          <StoryArcTab
            languageId={group.languageId}
            groupId={groupId}
            dueDate={dueDate}
            onSuccess={() => router.back()}
            onError={(msg) => toastError("Error", msg)}
          />
        )}
      </SafeAreaView>
    </>
  );
}
