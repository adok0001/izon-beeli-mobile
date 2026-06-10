import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { friendlyError } from "@/lib/api";
import {
  type EducatorSentenceTemplate,
  type EducatorScenario,
  type ScenarioTurn,
  type UpsertSentenceInput,
  useDeleteScenario,
  useDeleteSentence,
  useEducatorScenarios,
  useEducatorSentences,
  useCreateScenario,
  useUpdateScenario,
  useUpsertSentence,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";

type Tab = "sentences" | "scenarios";

// ── Sentence Form ──────────────────────────────────────────────────────────────

type SentenceForm = {
  id?: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation: string;
};

const EMPTY_SENTENCE: SentenceForm = {
  sentence: "",
  answer: "",
  englishSentence: "",
  kind: "blank",
  literalTranslation: "",
};

// ── Scenario Form ─────────────────────────────────────────────────────────────

type ScenarioForm = {
  id?: string;
  situation: string;
  turns: { text: string; translation: string }[];
};

const EMPTY_SCENARIO: ScenarioForm = {
  situation: "",
  turns: [{ text: "", translation: "" }],
};

// ─────────────────────────────────────────────────────────────────────────────

export default function SentencesAdminScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("sentences");

  // Sentences state
  const { data: sentences = [], isLoading: sentLoading } = useEducatorSentences(selectedLanguage);
  const upsertSentence = useUpsertSentence();
  const deleteSentence = useDeleteSentence();
  const [sentForm, setSentForm] = useState<SentenceForm>(EMPTY_SENTENCE);
  const [sentEditing, setSentEditing] = useState(false);

  // Scenarios state
  const { data: scenarios = [], isLoading: scenLoading } = useEducatorScenarios(selectedLanguage);
  const createScenario = useCreateScenario();
  const updateScenario = useUpdateScenario();
  const deleteScenario = useDeleteScenario();
  const [scenForm, setScenForm] = useState<ScenarioForm>(EMPTY_SCENARIO);
  const [scenEditing, setScenEditing] = useState(false);

  // ── Sentence handlers ──────────────────────────────────────────────────────

  const handleSentSubmit = async () => {
    if (!sentForm.sentence.trim() || !sentForm.answer.trim() || !sentForm.englishSentence.trim()) {
      toast.error("Sentence, answer, and English translation are required");
      return;
    }
    try {
      await upsertSentence.mutateAsync({
        id: sentForm.id,
        languageId: selectedLanguage,
        sentence: sentForm.sentence.trim(),
        answer: sentForm.answer.trim(),
        englishSentence: sentForm.englishSentence.trim(),
        kind: sentForm.kind,
        literalTranslation: sentForm.literalTranslation.trim() || undefined,
      });
      setSentForm(EMPTY_SENTENCE);
      setSentEditing(false);
      toast.success(sentForm.id ? "Sentence updated" : "Sentence added");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const handleSentEdit = (item: EducatorSentenceTemplate) => {
    setSentForm({
      id: item.id,
      sentence: item.sentence,
      answer: item.answer,
      englishSentence: item.englishSentence,
      kind: item.kind,
      literalTranslation: item.literalTranslation ?? "",
    });
    setSentEditing(true);
  };

  const handleSentDelete = (item: EducatorSentenceTemplate) => {
    Alert.alert("Delete Sentence", `Delete "${item.sentence}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSentence.mutateAsync({ id: item.id, languageId: selectedLanguage });
            toast.success("Sentence deleted");
          } catch (e) {
            toast.error(friendlyError(e));
          }
        },
      },
    ]);
  };

  // ── Scenario handlers ──────────────────────────────────────────────────────

  const handleScenSubmit = async () => {
    if (!scenForm.situation.trim() || scenForm.turns.some((t) => !t.text.trim() || !t.translation.trim())) {
      toast.error("Situation and all turns (text + translation) are required");
      return;
    }
    try {
      if (scenForm.id) {
        await updateScenario.mutateAsync({
          id: scenForm.id,
          languageId: selectedLanguage,
          situation: scenForm.situation.trim(),
          turns: scenForm.turns,
        });
      } else {
        await createScenario.mutateAsync({
          languageId: selectedLanguage,
          situation: scenForm.situation.trim(),
          turns: scenForm.turns,
        });
      }
      setScenForm(EMPTY_SCENARIO);
      setScenEditing(false);
      toast.success(scenForm.id ? "Scenario updated" : "Scenario added");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const handleScenEdit = (item: EducatorScenario) => {
    setScenForm({ id: item.id, situation: item.situation, turns: item.turns });
    setScenEditing(true);
  };

  const handleScenDelete = (item: EducatorScenario) => {
    Alert.alert("Delete Scenario", `Delete "${item.situation}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteScenario.mutateAsync({ id: item.id, languageId: selectedLanguage });
            toast.success("Scenario deleted");
          } catch (e) {
            toast.error(friendlyError(e));
          }
        },
      },
    ]);
  };

  const inputStyle = {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: M.border,
    backgroundColor: M.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: M.inputText,
    marginBottom: 8,
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sentences & Scenarios", headerShown: true }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Language picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.id}
                onPress={() => setSelectedLanguage(lang.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
                  borderColor: selectedLanguage === lang.id ? M.accent : M.border,
                  backgroundColor: selectedLanguage === lang.id ? M.accentGlow : M.card,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: selectedLanguage === lang.id ? M.accent : M.sub }}>
                  {lang.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Tab switcher */}
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, overflow: "hidden" }}>
            {(["sentences", "scenarios"] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: tab === t ? M.accent : "transparent" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: tab === t ? M.ink : M.sub }}>
                  {t === "sentences" ? "Sentences" : "Scenarios"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "sentences" ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Sentence form */}
              <View style={{ marginBottom: 20, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 10 }}>
                  {sentEditing ? "Edit Sentence" : "Add Sentence"}
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Sentence (native language)"
                  placeholderTextColor={M.muted}
                  value={sentForm.sentence}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, sentence: v }))}
                />
                <TextInput
                  style={inputStyle}
                  placeholder="Answer (word to blank)"
                  placeholderTextColor={M.muted}
                  value={sentForm.answer}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, answer: v }))}
                />
                <TextInput
                  style={inputStyle}
                  placeholder="English sentence"
                  placeholderTextColor={M.muted}
                  value={sentForm.englishSentence}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, englishSentence: v }))}
                />
                {/* Kind selector */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  {(["blank", "equivalent"] as const).map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => setSentForm((f) => ({ ...f, kind: k }))}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                        borderWidth: 1, borderColor: sentForm.kind === k ? M.accent : M.border,
                        backgroundColor: sentForm.kind === k ? M.accentGlow : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: sentForm.kind === k ? M.accent : M.sub }}>
                        {k === "blank" ? "Fill-in-blank" : "Equivalent (idiom)"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {sentForm.kind === "equivalent" && (
                  <TextInput
                    style={inputStyle}
                    placeholder="Literal translation (optional)"
                    placeholderTextColor={M.muted}
                    value={sentForm.literalTranslation}
                    onChangeText={(v) => setSentForm((f) => ({ ...f, literalTranslation: v }))}
                  />
                )}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    label={sentEditing ? "Update" : "Add"}
                    onPress={handleSentSubmit}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  {sentEditing && (
                    <Button
                      label="Cancel"
                      onPress={() => { setSentForm(EMPTY_SENTENCE); setSentEditing(false); }}
                      variant="secondary"
                      style={{ flex: 1 }}
                      size="sm"
                    />
                  )}
                </View>
              </View>

              {/* Sentence list */}
              {sentences.map((item) => (
                <View key={item.id} style={{ marginBottom: 10, borderRadius: 12, backgroundColor: M.card, padding: 14, borderWidth: 1, borderColor: M.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: M.text }}>{item.sentence}</Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>Answer: <Text style={{ fontWeight: "700", color: M.accent }}>{item.answer}</Text></Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{item.englishSentence}</Text>
                      <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: item.kind === "equivalent" ? M.infoBg : M.accentGlow }}>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: item.kind === "equivalent" ? M.info : M.accent }}>{item.kind}</Text>
                        </View>
                        {item.literalTranslation && (
                          <Text style={{ fontSize: 10, color: M.muted }}>lit. "{item.literalTranslation}"</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ gap: 6 }}>
                      <Pressable onPress={() => handleSentEdit(item)} hitSlop={8}>
                        <IconSymbol name="pencil" size={16} color={M.accent} />
                      </Pressable>
                      <Pressable onPress={() => handleSentDelete(item)} hitSlop={8}>
                        <IconSymbol name="trash" size={16} color={M.error} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
              {!sentLoading && sentences.length === 0 && (
                <Text style={{ textAlign: "center", color: M.muted, fontSize: 13, marginTop: 12 }}>No sentences yet</Text>
              )}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Scenario form */}
              <View style={{ marginBottom: 20, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 10 }}>
                  {scenEditing ? "Edit Scenario" : "Add Scenario"}
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Situation label (e.g. Greet someone)"
                  placeholderTextColor={M.muted}
                  value={scenForm.situation}
                  onChangeText={(v) => setScenForm((f) => ({ ...f, situation: v }))}
                />
                <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 6, letterSpacing: 1 }}>
                  TURNS
                </Text>
                {scenForm.turns.map((turn, idx) => (
                  <View key={idx} style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: M.border, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: M.muted, marginBottom: 4 }}>Turn {idx + 1}</Text>
                    <TextInput
                      style={{ ...inputStyle, marginBottom: 4 }}
                      placeholder="Native text"
                      placeholderTextColor={M.muted}
                      value={turn.text}
                      onChangeText={(v) => setScenForm((f) => {
                        const turns = [...f.turns];
                        turns[idx] = { ...turns[idx], text: v };
                        return { ...f, turns };
                      })}
                    />
                    <TextInput
                      style={{ ...inputStyle, marginBottom: 0 }}
                      placeholder="English translation"
                      placeholderTextColor={M.muted}
                      value={turn.translation}
                      onChangeText={(v) => setScenForm((f) => {
                        const turns = [...f.turns];
                        turns[idx] = { ...turns[idx], translation: v };
                        return { ...f, turns };
                      })}
                    />
                    {scenForm.turns.length > 1 && (
                      <Pressable
                        onPress={() => setScenForm((f) => ({ ...f, turns: f.turns.filter((_, i) => i !== idx) }))}
                        style={{ marginTop: 4, alignSelf: "flex-end" }}
                      >
                        <Text style={{ fontSize: 11, color: M.error }}>Remove turn</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable
                  onPress={() => setScenForm((f) => ({ ...f, turns: [...f.turns, { text: "", translation: "" }] }))}
                  style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <IconSymbol name="plus.circle" size={14} color={M.accent} />
                  <Text style={{ fontSize: 13, color: M.accent, fontWeight: "600" }}>Add turn</Text>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button label={scenEditing ? "Update" : "Add"} onPress={handleScenSubmit} style={{ flex: 1 }} size="sm" />
                  {scenEditing && (
                    <Button
                      label="Cancel"
                      onPress={() => { setScenForm(EMPTY_SCENARIO); setScenEditing(false); }}
                      variant="secondary"
                      style={{ flex: 1 }}
                      size="sm"
                    />
                  )}
                </View>
              </View>

              {/* Scenario list */}
              {scenarios.map((item) => (
                <View key={item.id} style={{ marginBottom: 10, borderRadius: 12, backgroundColor: M.card, padding: 14, borderWidth: 1, borderColor: M.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: M.text, marginRight: 8 }}>{item.situation}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable onPress={() => handleScenEdit(item)} hitSlop={8}>
                        <IconSymbol name="pencil" size={16} color={M.accent} />
                      </Pressable>
                      <Pressable onPress={() => handleScenDelete(item)} hitSlop={8}>
                        <IconSymbol name="trash" size={16} color={M.error} />
                      </Pressable>
                    </View>
                  </View>
                  {item.turns.map((turn, i) => (
                    <View key={i} style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 12, color: M.sub }}>{turn.text}</Text>
                      <Text style={{ fontSize: 11, color: M.muted, fontStyle: "italic" }}>{turn.translation}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {!scenLoading && scenarios.length === 0 && (
                <Text style={{ textAlign: "center", color: M.muted, fontSize: 13, marginTop: 12 }}>No scenarios yet</Text>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
