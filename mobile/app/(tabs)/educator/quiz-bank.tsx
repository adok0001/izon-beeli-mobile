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
  useDeleteQuizQuestion,
  useEducatorQuizBank,
  useSubmitQuizForReview,
  useUpsertQuizQuestion,
  type QuizQuestion,
} from "@/lib/hooks/educator/use-quiz-bank";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
};

const EMPTY_FORM: QuizForm = {
  type: QUIZ_TYPES[0],
  prompt: "",
  answer: "",
  options: "",
  audioUrl: "",
  explanation: "",
};

export default function QuizBankScreen() {
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

  const [form, setForm] = useState<QuizForm>(EMPTY_FORM);
  const editing = !!form.id;

  const quizQuery = useEducatorQuizBank(activeLanguageId);
  const upsert = useUpsertQuizQuestion();
  const remove = useDeleteQuizQuestion();
  const submitForReview = useSubmitQuizForReview();
  const publish = usePublishContent("quiz_questions", [["educator", "quiz-bank", activeLanguageId]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  function resetForm() {
    setForm(EMPTY_FORM);
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
    });
  }

  function handleSave() {
    if (!form.type.trim() || !form.prompt.trim() || !form.answer.trim()) {
      toastError("Missing fields", "Type, prompt, and answer are required.");
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
      },
      {
        onSuccess: () => {
          toastSuccess(editing ? "Question updated" : "Draft created");
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
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Quiz bank</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Authored quiz questions for practice.</Text>
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
            {editing ? "Edit question" : "New question"}
          </Text>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>Type *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {QUIZ_TYPES.map((t) => {
                const active = t === form.type;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setForm({ ...form, type: t })}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                      backgroundColor: active ? M.accent : M.card,
                      borderWidth: 1, borderColor: active ? M.accent : M.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.ink : M.sub }}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <LabeledInput label="Prompt *" value={form.prompt} onChange={(v) => setForm({ ...form, prompt: v })} />
          <LabeledInput label="Answer *" value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} />
          <LabeledInput label="Options (comma-separated)" value={form.options} onChange={(v) => setForm({ ...form, options: v })} />
          <LabeledInput label="Audio URL" value={form.audioUrl} onChange={(v) => setForm({ ...form, audioUrl: v })} />
          <LabeledInput label="Explanation" value={form.explanation} onChange={(v) => setForm({ ...form, explanation: v })} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : editing ? "Save" : "Create draft"} onPress={handleSave} M={M} />
            {editing && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {quizQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {quizQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No quiz questions yet for {getLanguageName(activeLanguageId)}.</Text>
        )}
        <View style={{ gap: 10 }}>
          {quizQuery.data?.map((q) => (
            <View key={q.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{q.prompt}</Text>
                {q.status && <Badge label={STATUS_LABEL[q.status as ContentStatus]} tone={STATUS_TONE[q.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>{q.type}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{q.answer}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canSubmitForReview(q.status) && (
                  <SmallButton label="Submit" onPress={() =>
                    submitForReview.mutate(q.id, {
                      onSuccess: () => toastSuccess("Submitted for review"),
                      onError: (e: Error) => toastError("Failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                {canPublishContent(q.status, q.createdBy, actor) && (
                  <SmallButton label="Publish" tone="publish" onPress={() =>
                    publish.mutate(q.id, {
                      onSuccess: () => toastSuccess("Published"),
                      onError: (e: Error) => toastError("Publish failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label="Edit" onPress={() => startEdit(q)} M={M} />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(q.id, {
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
