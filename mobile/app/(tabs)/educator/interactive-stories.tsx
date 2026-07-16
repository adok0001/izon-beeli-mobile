import { LanguagePickerModal } from "@/components/language-picker";
import { GhostButton, LabeledInput, NewButton, PrimaryButton, SmallButton } from "@/components/studio/editor-form";
import {
  emptyScene,
  nextKey,
  retargetSceneId,
  SceneEditor,
  type SceneDraft,
} from "@/components/studio/interactive-story-scene-editor";
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
} from "@/lib/hooks/educator/use-content-workflow";
import {
  useCreateInteractiveStory,
  useDeleteInteractiveStory,
  useEducatorInteractiveStories,
  useUpdateInteractiveStory,
  type EducatorInteractiveStory,
  type StoryChoice,
  type StoryScene,
} from "@/lib/hooks/educator/use-interactive-stories";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LanguageEntry } from "@/lib/data/languages";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Interactive Story editor. A story is a graph of scenes:
 * narrative scenes link to one next scene, choice scenes branch into several,
 * conclusion scenes end the story. Mirrors the scenarios screen's shape
 * (language tabs, draft/submit/publish workflow) with a scene/choice graph
 * editor (components/studio/interactive-story-scene-editor.tsx) in place of
 * the turn list.
 */

// Admin-only sentinel languageIds, both mirroring the server. "all" is a
// read-only aggregate — every story across all languages, no authoring into
// it. "general" is the language-agnostic bucket (stories tied to no single
// language, e.g. a pan-African piece) — a real, creatable scope.
const ALL_LANGUAGE_ID = "all";
const GENERAL_LANGUAGE_ID = "general";

export default function InteractiveStoriesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const languageLabel = useCallback(
    (id: string) => {
      if (id === ALL_LANGUAGE_ID) return t("educator.interactiveStoriesEditor.allScopeLabel");
      if (id === GENERAL_LANGUAGE_ID) return t("educator.interactiveStoriesEditor.generalLanguageLabel");
      return getLanguageName(id);
    },
    [t]
  );

  // A single stable reference shared by every SceneEditor, instead of a new
  // closure per scene on every render — i18next's generated types don't
  // accept a plain interpolation object here (same workaround used by
  // story-edit.tsx's ChapterEditor).
  const sceneT = useCallback((key: string, opts?: Record<string, unknown>) => t(key as any, opts as any) as string, [t]);

  const allowedLanguages = useMemo(
    () =>
      user.isAdmin
        ? [ALL_LANGUAGE_ID, GENERAL_LANGUAGE_ID, ...LANGUAGES.map((l) => l.id)]
        : user.reviewerLanguages,
    [user]
  );

  // Studio authors for every language, plus the two admin-only scopes pinned
  // to the top of the picker: the "All" aggregate and the language-agnostic
  // bucket.
  const languagePool = useMemo<LanguageEntry[]>(
    () => [
      {
        id: ALL_LANGUAGE_ID,
        name: t("educator.interactiveStoriesEditor.allScopeLabel"),
        nativeName: t("educator.interactiveStoriesEditor.allScopeHint"),
        region: t("educator.interactiveStoriesEditor.allScopeLabel"),
      },
      {
        id: GENERAL_LANGUAGE_ID,
        name: t("educator.interactiveStoriesEditor.generalLanguageLabel"),
        nativeName: t("educator.interactiveStoriesEditor.generalLanguageHint"),
        region: t("educator.interactiveStoriesEditor.allScopeLabel"),
      },
      ...LANGUAGES,
    ],
    [t]
  );

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";
  // "All" is a read-only aggregate — no single language to author into.
  const isAllScope = activeLanguageId === ALL_LANGUAGE_ID;

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("5");
  const [coverEmoji, setCoverEmoji] = useState("📖");
  const [coverGradientFrom, setCoverGradientFrom] = useState("#8B5E1F");
  const [coverGradientTo, setCoverGradientTo] = useState("#C4862A");
  const [initialSceneId, setInitialSceneId] = useState("");
  const [scenes, setScenes] = useState<SceneDraft[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const editing = !!editingId;

  const storiesQuery = useEducatorInteractiveStories(activeLanguageId);
  const { refetch: refetchStories } = storiesQuery;
  const create = useCreateInteractiveStory();
  const update = useUpdateInteractiveStory();
  const remove = useDeleteInteractiveStory();
  const publish = usePublishContent("interactive_stories", [["educator", "interactive-stories", activeLanguageId]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStories();
    setRefreshing(false);
  }, [refetchStories]);

  function resetForm() {
    setEditingId(undefined);
    setTitle("");
    setDescription("");
    setAuthor("");
    setEstimatedMinutes("5");
    setCoverEmoji("📖");
    setCoverGradientFrom("#8B5E1F");
    setCoverGradientTo("#C4862A");
    setInitialSceneId("");
    setScenes([]);
    setFormOpen(false);
  }

  function startEdit(story: EducatorInteractiveStory) {
    setEditingId(story.id);
    setTitle(story.title);
    setDescription(story.description);
    setAuthor(story.author);
    setEstimatedMinutes(String(story.estimatedMinutes));
    setCoverEmoji(story.coverEmoji);
    setCoverGradientFrom(story.coverGradient[0]);
    setCoverGradientTo(story.coverGradient[1]);
    setInitialSceneId(story.initialSceneId);
    setScenes(
      Object.values(story.scenes).map((scene: StoryScene) => ({
        key: nextKey("scene"),
        id: scene.id,
        type: scene.type,
        gradientFrom: scene.gradient[0],
        gradientTo: scene.gradient[1],
        backgroundEmoji: scene.backgroundEmoji,
        title: scene.title ?? "",
        text: scene.text,
        nextSceneId: scene.nextSceneId ?? "",
        choices: (scene.choices ?? []).map((choice: StoryChoice) => ({
          key: nextKey("choice"),
          id: choice.id,
          text: choice.text,
          nextSceneId: choice.nextSceneId,
        })),
      }))
    );
    setFormOpen(true);
  }

  function addScene() {
    const taken = new Set(scenes.map((s) => s.id));
    const scene = emptyScene(taken);
    setScenes((prev) => [...prev, scene]);
    if (!initialSceneId) setInitialSceneId(scene.id);
  }

  function updateScene(index: number, updated: SceneDraft) {
    const previousId = scenes[index].id;
    const renamed = updated.id !== previousId;
    setScenes((prev) => {
      const relinked = renamed ? retargetSceneId(prev, previousId, updated.id) : prev;
      return relinked.map((s, i) => (i === index ? updated : s));
    });
    if (renamed && initialSceneId === previousId) setInitialSceneId(updated.id);
  }

  function removeScene(index: number) {
    const removed = scenes[index];
    setScenes((prev) => prev.filter((_, i) => i !== index));
    if (initialSceneId === removed.id) {
      setInitialSceneId(scenes.filter((_, i) => i !== index)[0]?.id ?? "");
    }
  }

  // Recomputed only when the scene list itself changes, not on every
  // keystroke elsewhere in the form (title, description, ...).
  const allSceneOptions = useMemo(
    () => scenes.filter((s) => s.id.trim()).map((s) => ({ key: s.key, id: s.id, label: s.title.trim() || s.id })),
    [scenes]
  );
  const sceneOptionsFor = (excludeKey: string) => allSceneOptions.filter((o) => o.key !== excludeKey);

  function handleSave() {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle || !cleanDescription) {
      toastError(t("educator.interactiveStoriesEditor.missingFields"), t("educator.interactiveStoriesEditor.missingFieldsDetail"));
      return;
    }
    if (scenes.length === 0) {
      toastError(t("educator.interactiveStoriesEditor.missingScenes"), t("educator.interactiveStoriesEditor.missingScenesDetail"));
      return;
    }

    const seenIds = new Set<string>();
    for (const scene of scenes) {
      const id = scene.id.trim();
      if (seenIds.has(id)) {
        toastError(t("educator.interactiveStoriesEditor.duplicateSceneId"), t("educator.interactiveStoriesEditor.duplicateSceneIdDetail", { id }));
        return;
      }
      seenIds.add(id);
    }

    for (const [i, scene] of scenes.entries()) {
      if (!scene.id.trim() || !scene.text.trim()) {
        toastError(t("educator.interactiveStoriesEditor.incompleteScene"), t("educator.interactiveStoriesEditor.incompleteSceneDetail", { number: i + 1 }));
        return;
      }
      if (scene.type === "narrative" && !scene.nextSceneId) {
        toastError(t("educator.interactiveStoriesEditor.missingSceneLink"), t("educator.interactiveStoriesEditor.missingSceneLinkDetail", { number: i + 1 }));
        return;
      }
      if (scene.type === "choice") {
        if (scene.choices.length === 0) {
          toastError(t("educator.interactiveStoriesEditor.missingChoices"), t("educator.interactiveStoriesEditor.missingChoicesDetail", { number: i + 1 }));
          return;
        }
        for (const [ci, choice] of scene.choices.entries()) {
          if (!choice.text.trim() || !choice.nextSceneId) {
            toastError(
              t("educator.interactiveStoriesEditor.incompleteChoice"),
              t("educator.interactiveStoriesEditor.incompleteChoiceDetail", { number: ci + 1, scene: i + 1 })
            );
            return;
          }
        }
      }
    }

    if (!initialSceneId || !seenIds.has(initialSceneId)) {
      toastError(t("educator.interactiveStoriesEditor.missingOpeningScene"), t("educator.interactiveStoriesEditor.missingOpeningSceneDetail"));
      return;
    }

    const cleanScenes: Record<string, StoryScene> = {};
    for (const scene of scenes) {
      const id = scene.id.trim();
      cleanScenes[id] = {
        id,
        type: scene.type,
        gradient: [scene.gradientFrom, scene.gradientTo],
        backgroundEmoji: scene.backgroundEmoji.trim() || "📖",
        title: scene.title.trim() || undefined,
        text: scene.text.trim(),
        ...(scene.type === "choice"
          ? { choices: scene.choices.map((c) => ({ id: c.id.trim(), text: c.text.trim(), nextSceneId: c.nextSceneId })) }
          : {}),
        ...(scene.type === "narrative" ? { nextSceneId: scene.nextSceneId } : {}),
      };
    }

    const payload = {
      languageId: activeLanguageId,
      title: cleanTitle,
      description: cleanDescription,
      author: author.trim() || "Beeli",
      estimatedMinutes: Number(estimatedMinutes) || 5,
      coverEmoji: coverEmoji.trim() || "📖",
      coverGradient: [coverGradientFrom, coverGradientTo] as [string, string],
      initialSceneId,
      scenes: cleanScenes,
    };

    if (editing && editingId) {
      update.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toastSuccess(t("educator.interactiveStoriesEditor.updated"));
            resetForm();
          },
          onError: (err: Error) => toastError(t("educator.interactiveStoriesEditor.saveFailed"), friendlyError(err, err.message)),
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toastSuccess(t("educator.interactiveStoriesEditor.created"));
          resetForm();
        },
        onError: (err: Error) => toastError(t("educator.interactiveStoriesEditor.saveFailed"), friendlyError(err, err.message)),
      });
    }
  }

  const saving = create.isPending || update.isPending;
  const saveLabel = saving
    ? t("educator.interactiveStoriesEditor.saving")
    : editing
      ? t("common.save")
      : t("educator.interactiveStoriesEditor.createDraft");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>
            {t("educator.interactiveStoriesEditor.screenTitle")}
          </Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>{t("educator.interactiveStoriesEditor.subtitle")}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
      >
        {/* Language scope */}
        <Pressable
          onPress={() => setLanguagePickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t("languagePicker.title")}
          className="active:opacity-70"
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg,
            paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <IconSymbol name="globe" size={16} color={M.accent} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>
              {languageLabel(activeLanguageId)}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={M.muted} />
        </Pressable>

        {!formOpen && !isAllScope && (
          <NewButton label={t("educator.interactiveStoriesEditor.newButton")} onPress={() => setFormOpen(true)} M={M} />
        )}
        {!formOpen && isAllScope && (
          <Text style={{ fontSize: 12, color: M.muted, marginBottom: 12 }}>
            {t("educator.interactiveStoriesEditor.allScopeAddHint")}
          </Text>
        )}

        {/* Editor form */}
        {formOpen && (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
              {editing ? t("educator.interactiveStoriesEditor.editTitle") : t("educator.interactiveStoriesEditor.newTitle")}
            </Text>

            <LabeledInput label={t("educator.interactiveStoriesEditor.titleLabel")} value={title} onChange={setTitle} />
            <LabeledInput
              label={t("educator.interactiveStoriesEditor.descriptionLabel")}
              value={description}
              onChange={setDescription}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label={t("educator.interactiveStoriesEditor.authorLabel")} value={author} onChange={setAuthor} />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput
                  label={t("educator.interactiveStoriesEditor.estimatedMinutesLabel")}
                  value={estimatedMinutes}
                  onChange={setEstimatedMinutes}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label={t("educator.interactiveStoriesEditor.coverEmojiLabel")} value={coverEmoji} onChange={setCoverEmoji} />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput
                  label={t("educator.interactiveStoriesEditor.coverGradientFromLabel")}
                  value={coverGradientFrom}
                  onChange={setCoverGradientFrom}
                />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput
                  label={t("educator.interactiveStoriesEditor.coverGradientToLabel")}
                  value={coverGradientTo}
                  onChange={setCoverGradientTo}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 2 }}>
                {t("educator.interactiveStoriesEditor.openingSceneLabel")}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: initialSceneId ? M.accent : M.muted }}>
                {initialSceneId || t("educator.interactiveStoriesEditor.openingSceneNone")}
              </Text>
            </View>

            <Text style={{ fontSize: 12, fontWeight: "800", color: M.text, marginTop: 4 }}>
              {t("educator.interactiveStoriesEditor.scenesLabel")}
            </Text>
            {scenes.map((scene, index) => (
              <SceneEditor
                key={scene.key}
                index={index}
                scene={scene}
                sceneOptions={sceneOptionsFor(scene.key)}
                isOpening={scene.id === initialSceneId && scene.id !== ""}
                onChange={(updated) => updateScene(index, updated)}
                onDelete={() => removeScene(index)}
                onSetOpening={() => setInitialSceneId(scene.id)}
                M={M}
                t={sceneT}
              />
            ))}
            <View style={{ marginTop: 2 }}>
              <GhostButton label={t("educator.interactiveStoriesEditor.addScene")} onPress={addScene} M={M} />
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <PrimaryButton
                label={saveLabel}
                onPress={handleSave}
                M={M}
                disabled={saving}
              />
              <GhostButton label={t("common.cancel")} onPress={resetForm} M={M} />
            </View>
          </View>
        )}

        {/* List */}
        {storiesQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>{t("common.loading")}</Text>}
        {storiesQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>
            {t("educator.interactiveStoriesEditor.empty", { language: languageLabel(activeLanguageId) })}
          </Text>
        )}
        <View style={{ gap: 10 }}>
          {storiesQuery.data?.map((story) => {
            const sceneCount = Object.keys(story.scenes).length;
            return (
              <View key={story.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>
                    {story.coverEmoji} {story.title}
                  </Text>
                  {story.status && <Badge label={STATUS_LABEL[story.status as ContentStatus]} tone={STATUS_TONE[story.status as ContentStatus]} />}
                </View>
                <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }} numberOfLines={2}>
                  {story.description}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 12, color: M.muted }}>
                  {isAllScope ? `${story.language ? getLanguageName(story.language) : t("educator.interactiveStoriesEditor.generalLanguageLabel")} · ` : ""}
                  {sceneCount === 1
                    ? t("educator.interactiveStoriesEditor.scenesCountOne", { count: 1 })
                    : t("educator.interactiveStoriesEditor.scenesCountMany", { count: sceneCount })}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {canSubmitForReview(story.status) && (
                    <SmallButton
                      label={t("educator.interactiveStoriesEditor.submitButton")}
                      onPress={() =>
                        update.mutate(
                          { id: story.id, languageId: activeLanguageId, status: "in_review" },
                          {
                            onSuccess: () => toastSuccess(t("educator.interactiveStoriesEditor.submitted")),
                            onError: (e: Error) => toastError(t("educator.interactiveStoriesEditor.submitFailed"), friendlyError(e)),
                          }
                        )
                      }
                      M={M}
                    />
                  )}
                  {canPublishContent(story.status, story.createdBy, actor) && (
                    <SmallButton
                      label={t("educator.interactiveStoriesEditor.publishButton")}
                      tone="publish"
                      onPress={() =>
                        publish.mutate(story.id, {
                          onSuccess: () => toastSuccess(t("educator.interactiveStoriesEditor.published")),
                          onError: (e: Error) => toastError(t("educator.interactiveStoriesEditor.publishFailed"), friendlyError(e)),
                        })
                      }
                      M={M}
                    />
                  )}
                  <SmallButton label={t("common.edit")} onPress={() => startEdit(story)} M={M} />
                  <SmallButton
                    label={t("common.delete")}
                    tone="danger"
                    onPress={() =>
                      remove.mutate(
                        { id: story.id, languageId: activeLanguageId },
                        {
                          onSuccess: () => toastSuccess(t("educator.interactiveStoriesEditor.deleted")),
                          onError: (e: Error) => toastError(t("educator.interactiveStoriesEditor.deleteFailed"), friendlyError(e)),
                        }
                      )
                    }
                    M={M}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <LanguagePickerModal
        visible={languagePickerVisible}
        selectedId={activeLanguageId}
        allowedIds={allowedLanguages}
        pool={languagePool}
        onSelect={(id) => {
          setSelectedLanguageId(id);
          resetForm();
          setLanguagePickerVisible(false);
        }}
        onClose={() => setLanguagePickerVisible(false)}
      />
    </SafeAreaView>
  );
}
