import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  EducatorCourse,
  EducatorStoryArc,
  useDeleteStoryArc,
  useEducatorCourses,
  useEducatorStoryArcs,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { getLanguageName } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ArcCard({
  arc,
  courseName,
  languageName,
  onEdit,
  onDelete,
}: Readonly<{
  arc: EducatorStoryArc;
  courseName: string;
  languageName: string;
  onEdit: () => void;
  onDelete: () => void;
}>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onEdit}
      className="rounded-2xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <View className="rounded-full bg-amber-100 self-start px-2 py-0.5 dark:bg-amber-900/30">
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {languageName}
            </Text>
          </View>
          <Text className="mt-1.5 text-base font-bold text-neutral-900 dark:text-white">
            {arc.title}
          </Text>
          <Text
            className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
            numberOfLines={2}
          >
            {arc.description}
          </Text>
          <Text className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
            {courseName}
          </Text>
        </View>
        <View className="ml-3 flex-row items-center gap-3">
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            hitSlop={8}
          >
            <IconSymbol name="trash" size={18} color={M.error} />
          </Pressable>
          <IconSymbol name="chevron.right" size={16} color={M.muted} />
        </View>
      </View>
    </Pressable>
  );
}

export default function EducatorStoriesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const { data: arcs = [], isLoading: arcsLoading } = useEducatorStoryArcs(canAccess);
  const { data: courses = [], isLoading: coursesLoading } = useEducatorCourses(canAccess);
  const deleteArc = useDeleteStoryArc();

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const isLoading = arcsLoading || coursesLoading;

  const handleDelete = (arc: EducatorStoryArc) => {
    Alert.alert(
      t("educator.story.deleteArcTitle"),
      t("educator.story.deleteArcMessage", { title: arc.title }),
      [
        { text: t("educator.story.deleteArcCancel"), style: "cancel" },
        {
          text: t("educator.story.deleteArcConfirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteArc.mutateAsync(arc.id);
              toastSuccess(t("educator.story.arcDeleted"));
            } catch (e) {
              toastError(friendlyError(e as Error));
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("educator.story.screenTitle"),
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/educator/story-new" as never)}
              className="mr-2"
            >
              <IconSymbol name="plus.circle.fill" size={22} color={getAccent("amber").solid} />
            </Pressable>
          ),
        }}
      />
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950" edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text className="mt-8 text-center text-sm text-neutral-400">{t("educator.story.loading")}</Text>
          ) : arcs.length === 0 ? (
            <View className="mt-20 items-center">
              <IconSymbol name="book.closed.fill" size={48} color={M.border} />
              <Text className="mt-4 text-center text-base font-semibold text-neutral-500 dark:text-neutral-400">
                {t("educator.story.noArcsTitle")}
              </Text>
              <Text className="mt-1 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {t("educator.story.noArcsSubtitle")}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {arcs.map((arc) => {
                const course: EducatorCourse | undefined = courseMap[arc.courseId];
                return (
                  <ArcCard
                    key={arc.id}
                    arc={arc}
                    courseName={course?.title ?? arc.courseId}
                    languageName={course ? getLanguageName(course.languageId) : ""}
                    onEdit={() =>
                      router.push({
                        pathname: "/educator/story-edit",
                        params: { courseId: arc.courseId },
                      } as never)
                    }
                    onDelete={() => handleDelete(arc)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
