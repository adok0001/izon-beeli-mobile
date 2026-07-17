import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import {
  canPublishContent,
  canSubmitForReview,
  STATUS_LABEL,
  STATUS_TONE,
  usePublishContent,
  type ContentStatus,
  type WorkflowActor,
} from "@/lib/hooks/educator/use-content-workflow";
import {
  EducatorCourse,
  EducatorStoryArc,
  useDeleteStoryArc,
  useEducatorCourses,
  useEducatorStoryArcs,
  useUpdateStoryArc,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ArcCard({
  arc,
  courseName,
  languageName,
  actor,
  onEdit,
  onDelete,
  onSubmit,
  onPublish,
  onToast,
}: Readonly<{
  arc: EducatorStoryArc;
  courseName: string;
  languageName: string;
  actor: WorkflowActor;
  onEdit: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onPublish: () => void;
  onToast: { success: (title: string, body?: string) => void; error: (title: string, body?: string) => void };
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const status = arc.status as ContentStatus | undefined;

  return (
    <StudioCard>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }} numberOfLines={1}>
          {arc.title}
        </Text>
        {status && <Badge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />}
      </View>
      <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }} numberOfLines={2}>
        {arc.description}
      </Text>
      <Text style={{ marginTop: 4, fontSize: 12, color: M.muted }}>
        {languageName} · {courseName}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
        <ActiveToggle
          entityType="story_arcs"
          id={arc.id}
          isActive={arc.isActive ?? true}
          invalidateKeys={[["educator", "story-arcs"]]}
          M={M}
          onToast={onToast}
        />
        {canSubmitForReview(status) && (
          <ActionPill label={t("educator.story.submitButton")} onPress={onSubmit} />
        )}
        {canPublishContent(status, arc.createdBy, actor) && (
          <ActionPill icon="checkmark.circle.fill" label={t("educator.story.publishButton")} tone="success" onPress={onPublish} />
        )}
        <ActionPill icon="pencil" label={t("common.edit")} onPress={onEdit} />
        <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={onDelete} />
      </View>
    </StudioCard>
  );
}

export default function EducatorStoriesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const { user, canAccess } = useStudioAccess();

  const { data: arcs = [], isLoading: arcsLoading, refetch: refetchArcs } = useEducatorStoryArcs(canAccess);
  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useEducatorCourses(canAccess);
  const deleteArc = useDeleteStoryArc();
  const updateArc = useUpdateStoryArc();
  const publishArc = usePublishContent("story_arcs", [["educator", "story-arcs"]]);

  const actor: WorkflowActor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchArcs(), refetchCourses()]);
    setRefreshing(false);
  }, [refetchArcs, refetchCourses]);

  // Open by arc id, not course id — a standalone season has no owning course, and
  // looking it up by one is why the editor used to refuse them.
  const handleEdit = (arc: EducatorStoryArc) => {
    router.push({
      pathname: "/educator/story-edit",
      params: { arcId: arc.id },
    } as never);
  };

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

  const handleSubmit = (arc: EducatorStoryArc) => {
    updateArc.mutate(
      { id: arc.id, status: "in_review" },
      {
        onSuccess: () => toastSuccess(t("educator.story.submitted")),
        onError: (e: Error) => toastError(t("educator.story.submitFailed"), friendlyError(e)),
      }
    );
  };

  const handlePublish = (arc: EducatorStoryArc) => {
    publishArc.mutate(arc.id, {
      onSuccess: () => toastSuccess(t("educator.story.arcPublished")),
      onError: (e: Error) => toastError(t("educator.story.publishFailed"), friendlyError(e)),
    });
  };

  return (
    <>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("educator.story.screenTitle")}
          subtitle={t("educator.story.screenSubtitle")}
          action={{
            label: t("educator.story.newArcTitle"),
            onPress: () => router.push("/educator/story-new" as never),
          }}
        />

        <ScrollView
          style={{ flex: 1, backgroundColor: M.card }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
        >
          {isLoading ? (
            <Text style={{ color: M.muted, fontSize: 13 }}>{t("educator.story.loading")}</Text>
          ) : arcs.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 32 }}>
              <IconSymbol name="book.closed.fill" size={40} color={M.border} />
              <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: M.text, textAlign: "center" }}>
                {t("educator.story.noArcsTitle")}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: M.muted, textAlign: "center" }}>
                {t("educator.story.noArcsSubtitle")}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {arcs.map((arc) => {
                const course: EducatorCourse | undefined = arc.courseId ? courseMap[arc.courseId] : undefined;
                return (
                  <ArcCard
                    key={arc.id}
                    arc={arc}
                    courseName={course ? localize(course.title, uiLanguage) : t("educator.story.standaloneLabel")}
                    languageName={getLanguageName(arc.languageId ?? course?.languageId ?? "")}
                    actor={actor}
                    onEdit={() => handleEdit(arc)}
                    onDelete={() => handleDelete(arc)}
                    onSubmit={() => handleSubmit(arc)}
                    onPublish={() => handlePublish(arc)}
                    onToast={{ success: toastSuccess, error: toastError }}
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
