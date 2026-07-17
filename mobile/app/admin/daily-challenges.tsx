import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
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
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile (admin) — Daily challenge templates. The pool of quests that
 * `getOrCreateTodayChallenges` picks 3 from per user per day. Admin-only:
 * CRUD against /daily-challenges/admin.
 */

const CHALLENGE_TYPES: { value: ChallengeType; label: string }[] = [
  { value: "complete_quiz", label: "Complete quiz" },
  { value: "review_words", label: "Review words" },
  { value: "listen_lesson", label: "Listen lesson" },
  { value: "complete_lesson", label: "Complete lesson" },
  { value: "save_words", label: "Save words" },
];

type TemplateForm = {
  id?: string;
  challengeType: ChallengeType;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  xpReward: string;
  targetCasual: string;
  targetSteady: string;
  targetIntensive: string;
};

const EMPTY_FORM: TemplateForm = {
  challengeType: "complete_quiz",
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  xpReward: "20",
  targetCasual: "1",
  targetSteady: "2",
  targetIntensive: "3",
};

export default function DailyChallengeTemplatesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const editing = !!form.id;

  const templatesQuery = useAdminChallengeTemplates();
  const create = useCreateChallengeTemplate();
  const update = useUpdateChallengeTemplate();
  const deactivate = useDeactivateChallengeTemplate();

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(t: ChallengeTemplate) {
    setForm({
      id: t.id,
      challengeType: t.challengeType,
      title: t.title,
      titleFr: t.titleFr ?? "",
      description: t.description,
      descriptionFr: t.descriptionFr ?? "",
      xpReward: String(t.xpReward),
      targetCasual: String(t.targetCasual),
      targetSteady: String(t.targetSteady),
      targetIntensive: String(t.targetIntensive),
    });
  }

  function handleSave() {
    const xpReward = parseInt(form.xpReward, 10);
    const targetCasual = parseInt(form.targetCasual, 10);
    const targetSteady = parseInt(form.targetSteady, 10);
    const targetIntensive = parseInt(form.targetIntensive, 10);

    if (!form.title.trim() || !form.description.trim()) {
      toastError("Missing fields", "Title and description are required.");
      return;
    }
    if (![xpReward, targetCasual, targetSteady, targetIntensive].every((n) => Number.isInteger(n) && n > 0)) {
      toastError("Invalid numbers", "XP reward and targets must be positive whole numbers.");
      return;
    }

    const shared = {
      challengeType: form.challengeType,
      title: form.title.trim(),
      titleFr: form.titleFr.trim() || null,
      description: form.description.trim(),
      descriptionFr: form.descriptionFr.trim() || null,
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
      create.mutate(
        { ...shared, titleFr: shared.titleFr ?? undefined, descriptionFr: shared.descriptionFr ?? undefined },
        {
          onSuccess: () => {
            toastSuccess("Template created");
            resetForm();
          },
          onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Daily challenges</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>3 templates are picked per user per day from the active pool.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editor form */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
            {editing ? "Edit template" : "New template"}
          </Text>

          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 6 }}>Challenge type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CHALLENGE_TYPES.map((ct) => (
                <Pressable
                  key={ct.value}
                  onPress={() => setForm({ ...form, challengeType: ct.value })}
                  style={{
                    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
                    backgroundColor: form.challengeType === ct.value ? M.accent : M.card,
                    borderWidth: 1, borderColor: form.challengeType === ct.value ? M.accent : M.border,
                  }}
                  className="active:opacity-80"
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: form.challengeType === ct.value ? M.ink : M.sub }}>
                    {ct.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <LabeledInput label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <LabeledInput label="Title (French)" value={form.titleFr} onChange={(v) => setForm({ ...form, titleFr: v })} />
          <LabeledInput label="Description *" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
          <LabeledInput label="Description (French)" value={form.descriptionFr} onChange={(v) => setForm({ ...form, descriptionFr: v })} multiline />
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
            <PrimaryButton label={isSaving ? "Saving…" : editing ? "Save" : "Create template"} onPress={handleSave} M={M} />
            {editing && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {templatesQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {templatesQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No templates yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {templatesQuery.data?.map((t) => (
            <View key={t.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{t.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: t.active ? M.success : M.muted }} />
                  <Text style={{ fontSize: 12, color: t.active ? M.success : M.muted, fontWeight: "700" }}>
                    {t.active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }} numberOfLines={2}>
                {t.description}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: M.muted }}>
                {t.challengeType.replace(/_/g, " ")} · {t.xpReward} XP · Casual {t.targetCasual} · Steady {t.targetSteady} · Intensive {t.targetIntensive}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <SmallButton label="Edit" onPress={() => startEdit(t)} M={M} />
                <SmallButton
                  label="Deactivate"
                  tone="danger"
                  onPress={() =>
                    deactivate.mutate(t.id, {
                      onSuccess: () => toastSuccess("Deactivated"),
                      onError: (e: Error) => toastError("Deactivate failed", friendlyError(e)),
                    })
                  }
                  M={M}
                  disabled={!t.active}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type M = ReturnType<typeof useMuseumTheme>;

function LabeledInput({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "number-pad";
}>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={M.inputPlaceholder}
        style={{
          borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
          backgroundColor: M.inputBg, color: M.inputText,
          paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
          minHeight: multiline ? 60 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, M }: Readonly<{ label: string; onPress: () => void; M: M }>) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: M.accent }} className="active:opacity-80">
      <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress, M }: Readonly<{ label: string; onPress: () => void; M: M }>) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color: M.sub, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  label,
  onPress,
  tone,
  M,
  disabled,
}: Readonly<{ label: string; onPress: () => void; tone?: "danger"; M: M; disabled?: boolean }>) {
  const color = disabled ? M.muted : tone === "danger" ? M.error : M.sub;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, opacity: disabled ? 0.5 : 1 }}
      className="active:opacity-70"
    >
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
