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
  useCreateScenario,
  useDeleteScenario,
  useEducatorScenarios,
  useUpdateScenario,
  type EducatorScenario,
  type ScenarioTurn,
} from "@/lib/hooks/educator/use-scenarios";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Scenarios editor. Mirrors the proverbs screen: language tabs,
 * draft/submit/publish workflow, CRUD against /educator/scenarios. A scenario is
 * a situation plus an ordered list of dialogue turns (native text + translation).
 */

type TurnDraft = { text: string; translation: string };

const EMPTY_TURN: TurnDraft = { text: "", translation: "" };

export default function ScenariosScreen() {
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

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [situation, setSituation] = useState("");
  const [turns, setTurns] = useState<TurnDraft[]>([{ ...EMPTY_TURN }]);
  const editing = !!editingId;

  const scenariosQuery = useEducatorScenarios(activeLanguageId);
  const create = useCreateScenario();
  const update = useUpdateScenario();
  const remove = useDeleteScenario();
  const publish = usePublishContent("scenarios", [["educator", "scenarios", activeLanguageId]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  function resetForm() {
    setEditingId(undefined);
    setSituation("");
    setTurns([{ ...EMPTY_TURN }]);
  }

  function startEdit(s: EducatorScenario) {
    setEditingId(s.id);
    setSituation(s.situation);
    setTurns(
      s.turns.length > 0
        ? s.turns.map((t) => ({ text: t.text, translation: t.translation }))
        : [{ ...EMPTY_TURN }]
    );
  }

  function addTurn() {
    setTurns((prev) => [...prev, { ...EMPTY_TURN }]);
  }

  function removeTurn(index: number) {
    setTurns((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function updateTurn(index: number, patch: Partial<TurnDraft>) {
    setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function handleSave() {
    const cleanSituation = situation.trim();
    const cleanTurns: ScenarioTurn[] = turns
      .map((t) => ({ text: t.text.trim(), translation: t.translation.trim() }))
      .filter((t) => t.text && t.translation);

    if (!cleanSituation) {
      toastError("Missing fields", "A situation is required.");
      return;
    }
    if (cleanTurns.length === 0) {
      toastError("Missing turns", "Add at least one turn with text and translation.");
      return;
    }

    if (editing && editingId) {
      update.mutate(
        { id: editingId, languageId: activeLanguageId, situation: cleanSituation, turns: cleanTurns },
        {
          onSuccess: () => {
            toastSuccess("Scenario updated");
            resetForm();
          },
          onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
        }
      );
    } else {
      create.mutate(
        { languageId: activeLanguageId, situation: cleanSituation, turns: cleanTurns },
        {
          onSuccess: () => {
            toastSuccess("Draft created");
            resetForm();
          },
          onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
        }
      );
    }
  }

  const saving = create.isPending || update.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Scenarios</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Situational dialogues with turn-by-turn translations.</Text>
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
            {editing ? "Edit scenario" : "New scenario"}
          </Text>
          <LabeledInput label="Situation *" value={situation} onChange={setSituation} />

          <Text style={{ fontSize: 12, fontWeight: "800", color: M.text, marginTop: 4 }}>Turns *</Text>
          {turns.map((turn, index) => (
            <View key={index} style={{ borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 12, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: M.sub }}>Turn {index + 1}</Text>
                {turns.length > 1 && (
                  <SmallButton label="Remove" tone="danger" onPress={() => removeTurn(index)} M={M} />
                )}
              </View>
              <LabeledInput label="Text (native)" value={turn.text} onChange={(v) => updateTurn(index, { text: v })} />
              <LabeledInput label="Translation (EN)" value={turn.translation} onChange={(v) => updateTurn(index, { translation: v })} />
            </View>
          ))}
          <View style={{ marginTop: 2 }}>
            <GhostButton label="Add turn" onPress={addTurn} M={M} />
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={saving ? "Saving…" : editing ? "Save" : "Create draft"} onPress={handleSave} M={M} />
            {editing && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {scenariosQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {scenariosQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No scenarios yet for {getLanguageName(activeLanguageId)}.</Text>
        )}
        <View style={{ gap: 10 }}>
          {scenariosQuery.data?.map((s) => (
            <View key={s.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{s.situation}</Text>
                {s.status && <Badge label={STATUS_LABEL[s.status as ContentStatus]} tone={STATUS_TONE[s.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {s.turns.length} {s.turns.length === 1 ? "turn" : "turns"}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canSubmitForReview(s.status) && (
                  <SmallButton label="Submit" onPress={() =>
                    update.mutate(
                      { id: s.id, languageId: activeLanguageId, status: "in_review" },
                      {
                        onSuccess: () => toastSuccess("Submitted for review"),
                        onError: (e: Error) => toastError("Failed", friendlyError(e)),
                      }
                    )
                  } M={M} />
                )}
                {canPublishContent(s.status, s.createdBy, actor) && (
                  <SmallButton label="Publish" tone="publish" onPress={() =>
                    publish.mutate(s.id, {
                      onSuccess: () => toastSuccess("Published"),
                      onError: (e: Error) => toastError("Publish failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label="Edit" onPress={() => startEdit(s)} M={M} />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(
                    { id: s.id, languageId: activeLanguageId },
                    {
                      onSuccess: () => toastSuccess("Deleted"),
                      onError: (e: Error) => toastError("Delete failed", friendlyError(e)),
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
