import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ActionPill, ActiveTogglePill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { friendlyError } from "@/lib/api";
import {
  useAdminChallengeTemplates,
  useCreateChallengeTemplate,
  useDeactivateChallengeTemplate,
  useUpdateChallengeTemplate,
  type ChallengeTemplate,
  type ChallengeType,
} from "@/lib/hooks/use-daily-challenge-templates";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { localize } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile (admin) — Daily challenge templates. The pool of quests that
 * `getOrCreateTodayChallenges` picks 3 from per user per day. Admin-only:
 * CRUD against /daily-challenges/admin. Title/description use the standard
 * LocalizedTextInput (same widget Dictionary uses) instead of hardcoded
 * en/fr fields.
 */

const CHALLENGE_TYPES: { id: ChallengeType; label: string }[] = [
  { id: "complete_quiz", label: "Complete quiz" },
  { id: "review_words", label: "Review words" },
  { id: "listen_lesson", label: "Listen lesson" },
  { id: "complete_lesson", label: "Complete lesson" },
  { id: "save_words", label: "Save words" },
];

type TemplateForm = {
  id?: string;
  challengeType: ChallengeType;
  titleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
  xpReward: string;
  targetCasual: string;
  targetSteady: string;
  targetIntensive: string;
};

const EMPTY_FORM: TemplateForm = {
  challengeType: "complete_quiz",
  titleTranslations: {},
  descriptionTranslations: {},
  xpReward: "20",
  targetCasual: "1",
  targetSteady: "2",
  targetIntensive: "3",
};

export default function DailyChallengeTemplatesScreen() {
  const M = useMuseumTheme();
  const { uiLanguage } = useUiLanguageStore();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const editing = !!form.id;

  const templatesQuery = useAdminChallengeTemplates();
  const create = useCreateChallengeTemplate();
  const update = useUpdateChallengeTemplate();
  const deactivate = useDeactivateChallengeTemplate();

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(t: ChallengeTemplate) {
    setForm({
      id: t.id,
      challengeType: t.challengeType,
      titleTranslations: t.titleTranslations ?? { en: t.title, fr: t.titleFr ?? undefined },
      descriptionTranslations: t.descriptionTranslations ?? { en: t.description, fr: t.descriptionFr ?? undefined },
      xpReward: String(t.xpReward),
      targetCasual: String(t.targetCasual),
      targetSteady: String(t.targetSteady),
      targetIntensive: String(t.targetIntensive),
    });
    setFormOpen(true);
  }

  function handleSave() {
    const xpReward = parseInt(form.xpReward, 10);
    const targetCasual = parseInt(form.targetCasual, 10);
    const targetSteady = parseInt(form.targetSteady, 10);
    const targetIntensive = parseInt(form.targetIntensive, 10);

    if (!form.titleTranslations.en?.trim() || !form.descriptionTranslations.en?.trim()) {
      toastError("Missing fields", "Title and description (English) are required.");
      return;
    }
    if (![xpReward, targetCasual, targetSteady, targetIntensive].every((n) => Number.isInteger(n) && n > 0)) {
      toastError("Invalid numbers", "XP reward and targets must be positive whole numbers.");
      return;
    }

    const shared = {
      challengeType: form.challengeType,
      titleTranslations: form.titleTranslations,
      descriptionTranslations: form.descriptionTranslations,
      xpReward,
      targetCasual,
      targetSteady,
      targetIntensive,
    };

    if (editing) {
      update.mutate(
        { id: form.id!, ...shared },
        {
          onSuccess: () => {
            toastSuccess("Template updated");
            resetForm();
          },
          onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
        }
      );
    } else {
      create.mutate(shared, {
        onSuccess: () => {
          toastSuccess("Template created");
          resetForm();
        },
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
      });
    }
  }

  function toggleActive(t: ChallengeTemplate) {
    if (t.active) {
      deactivate.mutate(t.id, {
        onSuccess: () => toastSuccess("Deactivated"),
        onError: (e: Error) => toastError("Deactivate failed", friendlyError(e)),
      });
    } else {
      update.mutate(
        { id: t.id, active: true },
        {
          onSuccess: () => toastSuccess("Activated"),
          onError: (e: Error) => toastError("Activate failed", friendlyError(e)),
        }
      );
    }
  }

  const isSaving = create.isPending || update.isPending;

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
        title="Daily challenges"
        subtitle="3 templates are picked per user per day from the active pool."
        action={{ label: "New template", icon: "plus", onPress: openNew }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editor form */}
        {formOpen && (
        <StudioCard style={{ gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
            {editing ? "Edit template" : "New template"}
          </Text>

          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 6 }}>Challenge type</Text>
            <StudioFilterPills
              options={CHALLENGE_TYPES}
              value={form.challengeType}
              onChange={(challengeType) => setForm({ ...form, challengeType })}
              scrollable
            />
          </View>

          <LocalizedTextInput
            label="Title"
            required
            value={form.titleTranslations}
            onChange={(titleTranslations) => setForm({ ...form, titleTranslations })}
          />
          <LocalizedTextInput
            label="Description"
            required
            multiline
            value={form.descriptionTranslations}
            onChange={(descriptionTranslations) => setForm({ ...form, descriptionTranslations })}
          />

          <LabeledInput label="XP reward *" value={form.xpReward} onChange={(v) => setForm({ ...form, xpReward: v })} keyboardType="number-pad" />

          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 6 }}>Targets by daily goal *</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Casual" value={form.targetCasual} onChange={(v) => setForm({ ...form, targetCasual: v })} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Steady" value={form.targetSteady} onChange={(v) => setForm({ ...form, targetSteady: v })} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Intensive" value={form.targetIntensive} onChange={(v) => setForm({ ...form, targetIntensive: v })} keyboardType="number-pad" />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={isSaving ? "Saving…" : editing ? "Save" : "Create template"} onPress={handleSave} disabled={isSaving} />
            </View>
            <GhostButton label="Cancel" onPress={resetForm} />
          </View>
        </StudioCard>
        )}

        {/* List */}
        {templatesQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {templatesQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No templates yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {templatesQuery.data?.map((t) => (
            <StudioCard key={t.id}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>
                  {localize(t.titleTranslations ?? t.title, uiLanguage, t.title)}
                </Text>
                <ActiveTogglePill
                  active={t.active}
                  pending={deactivate.isPending || update.isPending}
                  onPress={() => toggleActive(t)}
                />
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }} numberOfLines={2}>
                {localize(t.descriptionTranslations ?? t.description, uiLanguage, t.description)}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: M.muted }}>
                {t.challengeType.replace(/_/g, " ")} · {t.xpReward} XP · Casual {t.targetCasual} · Steady {t.targetSteady} · Intensive {t.targetIntensive}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <ActionPill icon="pencil" label="Edit" onPress={() => startEdit(t)} />
              </View>
            </StudioCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
