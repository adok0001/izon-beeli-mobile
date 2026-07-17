import { Badge } from "@/components/ui/badge";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { friendlyError } from "@/lib/api";
import {
  canPublishContent,
  canSubmitForReview,
  STATUS_LABEL,
  STATUS_TONE,
  usePublishContent,
  type ContentStatus,
} from "@/lib/hooks/educator/use-content-workflow";
import {
  useDeleteQuizQuestion,
  useEducatorQuizBank,
  useSubmitQuizForReview,
  useUpsertQuizQuestion,
  type QuizQuestion,
} from "@/lib/hooks/educator/use-quiz-bank";
import { EntityPickerModal } from "@/components/studio/entity-picker-modal";
import { useEducatorLessons } from "@/lib/hooks/educator/use-lessons";
import { localize } from "@/lib/localize";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Quiz bank editor. Language tabs, draft/submit/publish
 * workflow, CRUD against /quiz-bank/admin. Mirrors the proverbs editor.
 */

const QUIZ_TYPES = ["word-to-english", "english-to-word", "fill-in-the-blank", "listening"] as const;
type QuizType = (typeof QUIZ_TYPES)[number];

type QuizForm = {
  id?: string;
  type: QuizType;
  prompt: string;
  answer: string;
  options: string;
  audioUrl: string;
  explanation: string;
  /** Retrieval scoping — lesson (and scene slug) this question tests. */
  lessonId: string;
  sceneId: string;
};

const EMPTY_FORM: QuizForm = {
  type: QUIZ_TYPES[0],
  prompt: "",
  answer: "",
  options: "",
  audioUrl: "",
  explanation: "",
  lessonId: "",
  sceneId: "",
};

export default function QuizBankScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { user } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const allowedLanguages = useMemo(
    () => (user.isAdmin ? LANGUAGES.map((l) => l.id) : user.reviewerLanguages),
    [user]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";

  const [form, setForm] = useState<QuizForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  // Leaving with the editor panel open risks losing an unsaved question.
  useUnsavedGuard(formOpen);
  const [lessonPickerVisible, setLessonPickerVisible] = useState(false);
  const editing = !!form.id;

  // Lessons in the active language, for linking a question to what it tests.
  const { data: allLessons = [] } = useEducatorLessons();
  const lessonPickerItems = useMemo(
    () =>
      allLessons
        .filter((l) => l.languageId === activeLanguageId)
        .map((l) => ({
          id: l.id,
          label: localize(l.title, "en"),
          sublabel: l.id,
          section: localize(l.courseTitle, "en"),
        })),
    [allLessons, activeLanguageId],
  );
  const linkedLesson = allLessons.find((l) => l.id === form.lessonId);

  const quizQuery = useEducatorQuizBank(activeLanguageId);
  const { refetch: refetchQuiz } = quizQuery;
  const upsert = useUpsertQuizQuestion();
  const remove = useDeleteQuizQuestion();
  const submitForReview = useSubmitQuizForReview();
  const publish = usePublishContent("quiz_questions", [["educator", "quiz-bank", activeLanguageId]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchQuiz();
    setRefreshing(false);
  }, [refetchQuiz]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function startEdit(q: QuizQuestion) {
    setForm({
      id: q.id,
      type: (QUIZ_TYPES.includes(q.type as QuizType) ? q.type : QUIZ_TYPES[0]) as QuizType,
      prompt: q.prompt,
      answer: q.answer,
      options: (q.options ?? []).join(", "),
      audioUrl: q.audioUrl ?? "",
      explanation: q.explanation ?? "",
      lessonId: q.lessonId ?? "",
      sceneId: q.sceneId ?? "",
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.type.trim() || !form.prompt.trim() || !form.answer.trim()) {
      toastError(t("educator.quizBankEditor.missingFields"), t("educator.quizBankEditor.missingFieldsDetail"));
      return;
    }
    upsert.mutate(
      {
        id: form.id,
        languageId: activeLanguageId,
        type: form.type.trim(),
        prompt: form.prompt.trim(),
        answer: form.answer.trim(),
        options: form.options.split(",").map((o) => o.trim()).filter(Boolean),
        audioUrl: form.audioUrl.trim() || undefined,
        explanation: form.explanation.trim() || undefined,
        // null (not undefined) so clearing an existing link round-trips.
        lessonId: form.lessonId.trim() || null,
        sceneId: form.sceneId.trim() || null,
      },
      {
        onSuccess: () => {
          toastSuccess(editing ? t("educator.quizBankEditor.updated") : t("educator.quizBankEditor.created"));
          resetForm();
        },
        onError: (err: Error) => toastError(t("educator.quizBankEditor.saveFailed"), friendlyError(err, err.message)),
      }
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <StudioScreenHeader
        title={t("admin.nav.quizBank")}
        subtitle={t("educator.quizBankEditor.subtitle")}
        action={!formOpen ? { label: t("educator.quizBankEditor.newButton"), icon: "plus", onPress: () => setFormOpen(true) } : undefined}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
      >
        {/* Language tabs */}
        <View style={{ marginBottom: 16 }}>
          <StudioFilterPills
            options={allowedLanguages.map((languageId) => ({ id: languageId, label: getLanguageName(languageId) }))}
            value={activeLanguageId}
            onChange={(languageId) => { setSelectedLanguageId(languageId); resetForm(); }}
            scrollable
          />
        </View>

        {/* Editor form */}
        {formOpen && (
          <StudioCard style={{ gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
              {editing ? t("educator.quizBankEditor.editTitle") : t("educator.quizBankEditor.newTitle")}
            </Text>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{t("educator.quizBankEditor.typeLabel")}</Text>
              <StudioFilterPills
                options={QUIZ_TYPES.map((qt) => ({ id: qt, label: qt }))}
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
                scrollable
              />
            </View>
            <LabeledInput label={t("educator.quizBankEditor.promptLabel")} value={form.prompt} onChange={(v) => setForm({ ...form, prompt: v })} />
            <LabeledInput label={t("educator.quizBankEditor.answerLabel")} value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} />
            <LabeledInput label={t("educator.quizBankEditor.optionsLabel")} value={form.options} onChange={(v) => setForm({ ...form, options: v })} />
            <LabeledInput label={t("educator.quizBankEditor.audioUrlLabel")} value={form.audioUrl} onChange={(v) => setForm({ ...form, audioUrl: v })} />
            <LabeledInput label={t("educator.quizBankEditor.explanationLabel")} value={form.explanation} onChange={(v) => setForm({ ...form, explanation: v })} />
            {/* Retrieval scoping — link this question to the lesson it tests */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>
                {t("educator.quizBankEditor.linkedLesson", { defaultValue: "Linked lesson (what this question tests)" })}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => setLessonPickerVisible(true)}
                  style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder, backgroundColor: M.inputBg, paddingHorizontal: 12, paddingVertical: 10 }}
                  className="active:opacity-70"
                >
                  <Text style={{ fontSize: 14, color: form.lessonId ? M.inputText : M.muted }} numberOfLines={1}>
                    {linkedLesson ? localize(linkedLesson.title, "en") : form.lessonId || t("educator.quizBankEditor.noLinkedLesson", { defaultValue: "None — language-level question" })}
                  </Text>
                </Pressable>
                {form.lessonId ? (
                  <ActionPill
                    icon="xmark.circle.fill"
                    label={t("common.clear", { defaultValue: "Clear" })}
                    onPress={() => setForm({ ...form, lessonId: "", sceneId: "" })}
                  />
                ) : null}
              </View>
            </View>
            {form.lessonId ? (
              <LabeledInput
                label={t("educator.quizBankEditor.sceneLabel", { defaultValue: "Scene slug (optional, e.g. house.kitchen)" })}
                value={form.sceneId}
                onChange={(v) => setForm({ ...form, sceneId: v })}
              />
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={upsert.isPending ? t("educator.quizBankEditor.saving") : editing ? t("common.save") : t("educator.quizBankEditor.createDraft")}
                  onPress={handleSave}
                  disabled={upsert.isPending}
                />
              </View>
              <GhostButton label={t("common.cancel")} onPress={resetForm} />
            </View>
          </StudioCard>
        )}

        {/* List */}
        {quizQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>{t("common.loading")}</Text>}
        {quizQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>{t("educator.quizBankEditor.empty", { language: getLanguageName(activeLanguageId) })}</Text>
        )}
        <View style={{ gap: 10 }}>
          {quizQuery.data?.map((q) => (
            <StudioCard key={q.id}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{q.prompt}</Text>
                {q.status && <Badge label={STATUS_LABEL[q.status as ContentStatus]} tone={STATUS_TONE[q.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{q.type}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{q.answer}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
                <ActiveToggle
                  entityType="quiz_questions"
                  id={q.id}
                  isActive={q.isActive ?? true}
                  invalidateKeys={[["educator", "quiz-bank", activeLanguageId]]}
                  M={M}
                  onToast={{ success: toastSuccess, error: toastError }}
                />
                {canSubmitForReview(q.status) && (
                  <ActionPill
                    icon="paperplane.fill"
                    label={t("educator.quizBankEditor.submitButton")}
                    onPress={() =>
                      submitForReview.mutate(q.id, {
                        onSuccess: () => toastSuccess(t("educator.quizBankEditor.submitted")),
                        onError: (e: Error) => toastError(t("educator.quizBankEditor.submitFailed"), friendlyError(e)),
                      })
                    }
                  />
                )}
                {canPublishContent(q.status, q.createdBy, actor) && (
                  <ActionPill
                    icon="checkmark.circle.fill"
                    label={t("educator.quizBankEditor.publishButton")}
                    tone="success"
                    onPress={() =>
                      publish.mutate(q.id, {
                        onSuccess: () => toastSuccess(t("educator.quizBankEditor.published")),
                        onError: (e: Error) => toastError(t("educator.quizBankEditor.publishFailed"), friendlyError(e)),
                      })
                    }
                  />
                )}
                <ActionPill icon="pencil" label={t("common.edit")} onPress={() => startEdit(q)} />
                <ActionPill
                  icon="trash.fill"
                  label={t("common.delete")}
                  tone="danger"
                  onPress={() =>
                    remove.mutate(q.id, {
                      onSuccess: () => toastSuccess(t("educator.quizBankEditor.deleted")),
                      onError: (e: Error) => toastError(t("educator.quizBankEditor.deleteFailed"), friendlyError(e)),
                    })
                  }
                />
              </View>
            </StudioCard>
          ))}
        </View>
      </ScrollView>

      <EntityPickerModal
        visible={lessonPickerVisible}
        title={t("educator.quizBankEditor.pickLesson", { defaultValue: "Link to a lesson" })}
        items={lessonPickerItems}
        selectedId={form.lessonId || undefined}
        onSelect={(id) => {
          setForm((prev) => ({ ...prev, lessonId: id }));
          setLessonPickerVisible(false);
        }}
        onClose={() => setLessonPickerVisible(false)}
      />
    </SafeAreaView>
  );
}
