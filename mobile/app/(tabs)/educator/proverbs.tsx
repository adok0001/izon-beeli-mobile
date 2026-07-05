import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Proverbs editor. Reference screen for the Phase 3 authoring
 * editors: language tabs, draft/submit/publish workflow, CRUD against
 * /proverbs/admin. Mirrors the web page at web/app/educator/proverbs/page.tsx.
 */

type ProverbForm = {
  id?: string;
  text: string;
  translation: string;
  translationFr: string;
  meaning: string;
  meaningFr: string;
  literal: string;
  context: string;
  tags: string;
};

const EMPTY_FORM: ProverbForm = {
  text: "",
  translation: "",
  translationFr: "",
  meaning: "",
  meaningFr: "",
  literal: "",
  context: "",
  tags: "",
};

export default function ProverbsScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { user } = useStudioAccess();
  const { success: toastSuccess, error: toastError } = useToast();

  const allowedLanguages = useMemo(
    () => (user.isAdmin ? LANGUAGES.map((l) => l.id) : user.reviewerLanguages),
    [user]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";

  const [form, setForm] = useState<ProverbForm>(EMPTY_FORM);
  const editing = !!form.id;

  const proverbsQuery = useEducatorProverbs(activeLanguageId);
  const upsert = useUpsertProverb();
  const remove = useDeleteProverb();
  const submitForReview = useSubmitProverbForReview();
  const publish = usePublishContent("proverbs", [["educator", "proverbs"], ["proverbs"]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(p: Proverb) {
    setForm({
      id: p.id,
      text: p.text,
      translation: p.translation,
      translationFr: p.translationFr ?? "",
      meaning: p.meaning,
      meaningFr: p.meaningFr ?? "",
      literal: p.literal ?? "",
      context: p.context ?? "",
      tags: (p.tags ?? []).join(", "),
    });
  }

  function handleSave() {
    if (!form.text.trim() || !form.translation.trim() || !form.meaning.trim()) {
      toastError("Missing fields", "Proverb, translation, and meaning are required.");
      return;
    }
    upsert.mutate(
      {
        id: form.id,
        languageId: activeLanguageId,
        text: form.text.trim(),
        translation: form.translation.trim(),
        translationFr: form.translationFr.trim() || undefined,
        meaning: form.meaning.trim(),
        meaningFr: form.meaningFr.trim() || undefined,
        literal: form.literal.trim() || undefined,
        context: form.context.trim() || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toastSuccess(editing ? "Proverb updated" : "Draft created");
          resetForm();
        },
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
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
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Proverbs</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Authored proverbs with their meanings.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
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

        {/* Editor form */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
            {editing ? "Edit proverb" : "New proverb"}
          </Text>
          <LabeledInput label="Proverb (native) *" value={form.text} onChange={(v) => setForm({ ...form, text: v })} />
          <LabeledInput label="Translation (EN) *" value={form.translation} onChange={(v) => setForm({ ...form, translation: v })} />
          <LabeledInput label="Translation (FR)" value={form.translationFr} onChange={(v) => setForm({ ...form, translationFr: v })} />
          <LabeledInput label="Meaning (EN) *" value={form.meaning} onChange={(v) => setForm({ ...form, meaning: v })} />
          <LabeledInput label="Meaning (FR)" value={form.meaningFr} onChange={(v) => setForm({ ...form, meaningFr: v })} />
          <LabeledInput label="Literal" value={form.literal} onChange={(v) => setForm({ ...form, literal: v })} />
          <LabeledInput label="Context" value={form.context} onChange={(v) => setForm({ ...form, context: v })} />
          <LabeledInput label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : editing ? "Save" : "Create draft"} onPress={handleSave} M={M} />
            {editing && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {proverbsQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {proverbsQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No proverbs yet for {getLanguageName(activeLanguageId)}.</Text>
        )}
        <View style={{ gap: 10 }}>
          {proverbsQuery.data?.map((p) => (
            <View key={p.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{p.text}</Text>
                {p.status && <Badge label={STATUS_LABEL[p.status as ContentStatus]} tone={STATUS_TONE[p.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{p.translation}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{p.meaning}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canSubmitForReview(p.status) && (
                  <SmallButton label="Submit" onPress={() =>
                    submitForReview.mutate(p.id, {
                      onSuccess: () => toastSuccess("Submitted for review"),
                      onError: (e: Error) => toastError("Failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                {canPublishContent(p.status, p.createdBy, actor) && (
                  <SmallButton label="Publish" tone="publish" onPress={() =>
                    publish.mutate(p.id, {
                      onSuccess: () => toastSuccess("Published"),
                      onError: (e: Error) => toastError("Publish failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label="Edit" onPress={() => startEdit(p)} M={M} />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(p.id, {
                    onSuccess: () => toastSuccess("Deleted"),
                    onError: (e: Error) => toastError("Delete failed", friendlyError(e)),
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

type M = ReturnType<typeof useMuseumTheme>;

function LabeledInput({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={M.inputPlaceholder}
        style={{
          borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
          backgroundColor: M.inputBg, color: M.inputText,
          paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
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

function SmallButton({ label, onPress, tone, M }: Readonly<{ label: string; onPress: () => void; tone?: "publish" | "danger"; M: M }>) {
  const color = tone === "publish" ? M.success : tone === "danger" ? M.error : M.sub;
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
