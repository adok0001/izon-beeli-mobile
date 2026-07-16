import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GhostButton, LabeledInput, NewButton, PrimaryButton, SmallButton } from "@/components/studio/editor-form";
import { LocalizedTextInput, serializeLocalizedText, toLocalizedText } from "@/components/ui/localized-text-input";
import { useStudioAccess } from "@/components/studio/studio-gate";
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
  useCreateScenario,
  useDeleteScenario,
  useEducatorScenarios,
  useUpdateScenario,
  type EducatorScenario,
  type ScenarioTurn,
} from "@/lib/hooks/educator/use-scenarios";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import type { LocalizedText } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Scenarios editor. Mirrors the proverbs screen: language tabs,
 * draft/submit/publish workflow, CRUD against /educator/scenarios. A scenario is
 * a situation plus an ordered list of dialogue turns (native text + translation).
 */

type TurnDraft = { text: string; translation: LocalizedText };

const EMPTY_TURN: TurnDraft = { text: "", translation: {} };

export default function ScenariosScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const allowedLanguages = useMemo(
    () => (user.isAdmin ? LANGUAGES.map((l) => l.id) : user.reviewerLanguages),
    [user]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [situation, setSituation] = useState("");
  const [turns, setTurns] = useState<TurnDraft[]>([{ ...EMPTY_TURN }]);
  const [formOpen, setFormOpen] = useState(false);
  // Leaving with the editor panel open risks losing an unsaved scenario.
  useUnsavedGuard(formOpen);
  const editing = !!editingId;

  const scenariosQuery = useEducatorScenarios(activeLanguageId);
  const { refetch: refetchScenarios } = scenariosQuery;
  const create = useCreateScenario();
  const update = useUpdateScenario();
  const remove = useDeleteScenario();
  const publish = usePublishContent("scenarios", [["educator", "scenarios", activeLanguageId]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchScenarios();
    setRefreshing(false);
  }, [refetchScenarios]);

  function resetForm() {
    setEditingId(undefined);
    setSituation("");
    setTurns([{ ...EMPTY_TURN }]);
    setFormOpen(false);
  }

  function startEdit(s: EducatorScenario) {
    setEditingId(s.id);
    setSituation(s.situation);
    setTurns(
      s.turns.length > 0
        ? s.turns.map((turn) => ({ text: turn.text, translation: toLocalizedText(turn.translation) }))
        : [{ ...EMPTY_TURN }]
    );
    setFormOpen(true);
  }

  function addTurn() {
    setTurns((prev) => [...prev, { ...EMPTY_TURN }]);
  }

  function removeTurn(index: number) {
    setTurns((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function updateTurn(index: number, patch: Partial<TurnDraft>) {
    setTurns((prev) => prev.map((turn, i) => (i === index ? { ...turn, ...patch } : turn)));
  }

  function handleSave() {
    const cleanSituation = situation.trim();
    const cleanTurns: ScenarioTurn[] = turns
      .map((turn) => ({ text: turn.text.trim(), translation: turn.translation }))
      .filter((turn) => turn.text && turn.translation.en?.trim())
      .map((turn) => ({ text: turn.text, translation: serializeLocalizedText(turn.translation).primary }));

    if (!cleanSituation) {
      toastError(t("educator.scenariosEditor.missingSituation"), t("educator.scenariosEditor.missingSituationDetail"));
      return;
    }
    if (cleanTurns.length === 0) {
      toastError(t("educator.scenariosEditor.missingTurns"), t("educator.scenariosEditor.missingTurnsDetail"));
      return;
    }

    if (editing && editingId) {
      update.mutate(
        { id: editingId, languageId: activeLanguageId, situation: cleanSituation, turns: cleanTurns },
        {
          onSuccess: () => {
            toastSuccess(t("educator.scenariosEditor.updated"));
            resetForm();
          },
          onError: (err: Error) => toastError(t("educator.scenariosEditor.saveFailed"), friendlyError(err, err.message)),
        }
      );
    } else {
      create.mutate(
        { languageId: activeLanguageId, situation: cleanSituation, turns: cleanTurns },
        {
          onSuccess: () => {
            toastSuccess(t("educator.scenariosEditor.created"));
            resetForm();
          },
          onError: (err: Error) => toastError(t("educator.scenariosEditor.saveFailed"), friendlyError(err, err.message)),
        }
      );
    }
  }

  const saving = create.isPending || update.isPending;

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
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>{t("admin.nav.scenarios")}</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>{t("educator.scenariosEditor.subtitle")}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
      >
        {/* Language tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {allowedLanguages.map((languageId) => {
              const active = languageId === activeLanguageId;
              return (
                <Pressable
                  key={languageId}
                  onPress={() => { setSelectedLanguageId(languageId); resetForm(); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: active ? M.accent : M.bg,
                    borderWidth: 1, borderColor: active ? M.accent : M.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: active ? M.ink : M.sub }}>
                    {getLanguageName(languageId)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {!formOpen && (
          <NewButton label={t("educator.scenariosEditor.newButton")} onPress={() => setFormOpen(true)} M={M} />
        )}

        {/* Editor form */}
        {formOpen && (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
              {editing ? t("educator.scenariosEditor.editTitle") : t("educator.scenariosEditor.newTitle")}
            </Text>
            <LabeledInput label={t("educator.scenariosEditor.situationLabel")} value={situation} onChange={setSituation} />

            <Text style={{ fontSize: 12, fontWeight: "800", color: M.text, marginTop: 4 }}>{t("educator.scenariosEditor.turnsLabel")}</Text>
            {turns.map((turn, index) => (
              <View key={index} style={{ borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 12, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: M.sub }}>{t("educator.scenariosEditor.turnLabel", { number: index + 1 })}</Text>
                  {turns.length > 1 && (
                    <SmallButton label={t("educator.scenariosEditor.removeTurn")} tone="danger" onPress={() => removeTurn(index)} M={M} />
                  )}
                </View>
                <LabeledInput label={t("educator.scenariosEditor.textLabel")} value={turn.text} onChange={(v) => updateTurn(index, { text: v })} />
                <LocalizedTextInput
                  label={t("educator.scenariosEditor.translationLabel")}
                  value={turn.translation}
                  onChange={(translation) => updateTurn(index, { translation })}
                  required
                />
              </View>
            ))}
            <View style={{ marginTop: 2 }}>
              <GhostButton label={t("educator.scenariosEditor.addTurn")} onPress={addTurn} M={M} />
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <PrimaryButton
                label={saving ? t("educator.scenariosEditor.saving") : editing ? t("common.save") : t("educator.scenariosEditor.createDraft")}
                onPress={handleSave}
                M={M}
                disabled={saving}
              />
              <GhostButton label={t("common.cancel")} onPress={resetForm} M={M} />
            </View>
          </View>
        )}

        {/* List */}
        {scenariosQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>{t("common.loading")}</Text>}
        {scenariosQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>{t("educator.scenariosEditor.empty", { language: getLanguageName(activeLanguageId) })}</Text>
        )}
        <View style={{ gap: 10 }}>
          {scenariosQuery.data?.map((s) => (
            <View key={s.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{s.situation}</Text>
                {s.status && <Badge label={STATUS_LABEL[s.status as ContentStatus]} tone={STATUS_TONE[s.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {s.turns.length === 1
                  ? t("educator.scenariosEditor.turnsCountOne", { count: 1 })
                  : t("educator.scenariosEditor.turnsCountMany", { count: s.turns.length })}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canSubmitForReview(s.status) && (
                  <SmallButton label={t("educator.scenariosEditor.submitButton")} onPress={() =>
                    update.mutate(
                      { id: s.id, languageId: activeLanguageId, status: "in_review" },
                      {
                        onSuccess: () => toastSuccess(t("educator.scenariosEditor.submitted")),
                        onError: (e: Error) => toastError(t("educator.scenariosEditor.submitFailed"), friendlyError(e)),
                      }
                    )
                  } M={M} />
                )}
                {canPublishContent(s.status, s.createdBy, actor) && (
                  <SmallButton label={t("educator.scenariosEditor.publishButton")} tone="publish" onPress={() =>
                    publish.mutate(s.id, {
                      onSuccess: () => toastSuccess(t("educator.scenariosEditor.published")),
                      onError: (e: Error) => toastError(t("educator.scenariosEditor.publishFailed"), friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label={t("common.edit")} onPress={() => startEdit(s)} M={M} />
                <SmallButton label={t("common.delete")} tone="danger" onPress={() =>
                  remove.mutate(
                    { id: s.id, languageId: activeLanguageId },
                    {
                      onSuccess: () => toastSuccess(t("educator.scenariosEditor.deleted")),
                      onError: (e: Error) => toastError(t("educator.scenariosEditor.deleteFailed"), friendlyError(e)),
                    }
                  )
                } M={M} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
