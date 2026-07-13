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
  useDeleteProverb,
  useEducatorProverbs,
  useSubmitProverbForReview,
  useUpsertProverb,
  type Proverb,
} from "@/lib/hooks/educator/use-proverbs";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Proverbs editor. Reference screen for the Phase 3 authoring
 * editors: language tabs, draft/submit/publish workflow, CRUD against
 * /proverbs/admin. Mirrors the web page at web/app/educator/proverbs/page.tsx.
 */

type ProverbForm = {
  id?: string;
  text: string;
  translation: LocalizedText;
  meaning: LocalizedText;
  literal: string;
  context: string;
  tags: string;
};

const EMPTY_FORM: ProverbForm = {
  text: "",
  translation: {},
  meaning: {},
  literal: "",
  context: "",
  tags: "",
};

export default function ProverbsScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useStudioAccess();
  const { uiLanguage } = useUiLanguageStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const allowedLanguages = useMemo(
    () => (user.isAdmin ? LANGUAGES.map((l) => l.id) : user.reviewerLanguages),
    [user]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";

  const [form, setForm] = useState<ProverbForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const editing = !!form.id;

  const proverbsQuery = useEducatorProverbs(activeLanguageId);
  const { refetch: refetchProverbs } = proverbsQuery;
  const upsert = useUpsertProverb();
  const remove = useDeleteProverb();
  const submitForReview = useSubmitProverbForReview();
  const publish = usePublishContent("proverbs", [["educator", "proverbs"], ["proverbs"]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchProverbs();
    setRefreshing(false);
  }, [refetchProverbs]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function startEdit(p: Proverb) {
    setForm({
      id: p.id,
      text: p.text,
      translation: toLocalizedText(p.translation, p.translationFr),
      meaning: toLocalizedText(p.meaning, p.meaningFr),
      literal: p.literal ?? "",
      context: p.context ?? "",
      tags: (p.tags ?? []).join(", "),
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.text.trim() || !form.translation.en?.trim() || !form.meaning.en?.trim()) {
      toastError(t("educator.proverbsEditor.missingFields"), t("educator.proverbsEditor.missingFieldsDetail"));
      return;
    }
    const translationSer = serializeLocalizedText(form.translation);
    const meaningSer = serializeLocalizedText(form.meaning);
    upsert.mutate(
      {
        id: form.id,
        languageId: activeLanguageId,
        text: form.text.trim(),
        translation: translationSer.primary,
        translationFr: translationSer.fr,
        meaning: meaningSer.primary,
        meaningFr: meaningSer.fr,
        literal: form.literal.trim() || undefined,
        context: form.context.trim() || undefined,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toastSuccess(editing ? t("educator.proverbsEditor.updated") : t("educator.proverbsEditor.created"));
          resetForm();
        },
        onError: (err: Error) => toastError(t("educator.proverbsEditor.saveFailed"), friendlyError(err, err.message)),
      }
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>{t("admin.nav.proverbs")}</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>{t("educator.proverbsEditor.subtitle")}</Text>
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
          <NewButton label={t("educator.proverbsEditor.newButton")} onPress={() => setFormOpen(true)} M={M} />
        )}

        {/* Editor form */}
        {formOpen && (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
              {editing ? t("educator.proverbsEditor.editTitle") : t("educator.proverbsEditor.newTitle")}
            </Text>
            <LabeledInput label={t("educator.proverbsEditor.textLabel")} value={form.text} onChange={(v) => setForm({ ...form, text: v })} />
            <LocalizedTextInput
              label={t("educator.proverbsEditor.translationLabel")}
              value={form.translation}
              onChange={(translation) => setForm((f) => ({ ...f, translation }))}
              required
            />
            <LocalizedTextInput
              label={t("educator.proverbsEditor.meaningLabel")}
              value={form.meaning}
              onChange={(meaning) => setForm((f) => ({ ...f, meaning }))}
              required
            />
            <LabeledInput label={t("educator.proverbsEditor.literalLabel")} value={form.literal} onChange={(v) => setForm({ ...form, literal: v })} />
            <LabeledInput label={t("educator.proverbsEditor.contextLabel")} value={form.context} onChange={(v) => setForm({ ...form, context: v })} />
            <LabeledInput label={t("educator.proverbsEditor.tagsLabel")} value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <PrimaryButton
                label={upsert.isPending ? t("educator.proverbsEditor.saving") : editing ? t("common.save") : t("educator.proverbsEditor.createDraft")}
                onPress={handleSave}
                M={M}
                disabled={upsert.isPending}
              />
              <GhostButton label={t("common.cancel")} onPress={resetForm} M={M} />
            </View>
          </View>
        )}

        {/* List */}
        {proverbsQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>{t("common.loading")}</Text>}
        {proverbsQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>{t("educator.proverbsEditor.empty", { language: getLanguageName(activeLanguageId) })}</Text>
        )}
        <View style={{ gap: 10 }}>
          {proverbsQuery.data?.map((p) => (
            <View key={p.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{p.text}</Text>
                {p.status && <Badge label={STATUS_LABEL[p.status as ContentStatus]} tone={STATUS_TONE[p.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{localize(p.translation, uiLanguage)}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{localize(p.meaning, uiLanguage)}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canSubmitForReview(p.status) && (
                  <SmallButton label={t("educator.proverbsEditor.submitButton")} onPress={() =>
                    submitForReview.mutate(p.id, {
                      onSuccess: () => toastSuccess(t("educator.proverbsEditor.submitted")),
                      onError: (e: Error) => toastError(t("educator.proverbsEditor.submitFailed"), friendlyError(e)),
                    })
                  } M={M} />
                )}
                {canPublishContent(p.status, p.createdBy, actor) && (
                  <SmallButton label={t("educator.proverbsEditor.publishButton")} tone="publish" onPress={() =>
                    publish.mutate(p.id, {
                      onSuccess: () => toastSuccess(t("educator.proverbsEditor.published")),
                      onError: (e: Error) => toastError(t("educator.proverbsEditor.publishFailed"), friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label={t("common.edit")} onPress={() => startEdit(p)} M={M} />
                <SmallButton label={t("common.delete")} tone="danger" onPress={() =>
                  remove.mutate(p.id, {
                    onSuccess: () => toastSuccess(t("educator.proverbsEditor.deleted")),
                    onError: (e: Error) => toastError(t("educator.proverbsEditor.deleteFailed"), friendlyError(e)),
                  })
                } M={M} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
