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
      toast.error(t("educator.sentences.validationRequired"));
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
      toast.success(sentForm.id ? t("educator.sentences.updated") : t("educator.sentences.added"));
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
    Alert.alert(t("educator.sentences.deleteTitle"), t("educator.sentences.deleteConfirm", { sentence: item.sentence }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSentence.mutateAsync({ id: item.id, languageId: selectedLanguage });
            toast.success(t("educator.sentences.deleted"));
          } catch (e) {
            toast.error(friendlyError(e));
          }
        },
      },
    ]);
  };

  // ── Scenario handlers ──────────────────────────────────────────────────────

  const handleScenSubmit = async () => {
    if (!scenForm.situation.trim() || scenForm.turns.some((turn) => !turn.text.trim() || !turn.translation.trim())) {
      toast.error(t("educator.scenarios.validationRequired"));
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
      toast.success(scenForm.id ? t("educator.scenarios.updated") : t("educator.scenarios.added"));
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const handleScenEdit = (item: EducatorScenario) => {
    setScenForm({ id: item.id, situation: item.situation, turns: item.turns });
    setScenEditing(true);
  };

  const handleScenDelete = (item: EducatorScenario) => {
    Alert.alert(t("educator.scenarios.deleteTitle"), t("educator.scenarios.deleteConfirm", { situation: item.situation }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteScenario.mutateAsync({ id: item.id, languageId: selectedLanguage });
            toast.success(t("educator.scenarios.deleted"));
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
      <Stack.Screen options={{ title: t("educator.sentences.screenTitle"), headerShown: true }} />
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
            {(["sentences", "scenarios"] as Tab[]).map((tabKey) => (
              <Pressable
                key={tabKey}
                onPress={() => setTab(tabKey)}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: tab === tabKey ? M.accent : "transparent" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: tab === tabKey ? M.ink : M.sub }}>
                  {tabKey === "sentences" ? t("educator.sentences.tabSentences") : t("educator.sentences.tabScenarios")}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "sentences" ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Sentence form */}
              <View style={{ marginBottom: 20, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 10 }}>
                  {sentEditing ? t("educator.sentences.editTitle") : t("educator.sentences.addTitle")}
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("educator.sentences.sentencePlaceholder")}
                  placeholderTextColor={M.muted}
                  value={sentForm.sentence}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, sentence: v }))}
                />
                <TextInput
                  style={inputStyle}
                  placeholder={t("educator.sentences.answerPlaceholder")}
                  placeholderTextColor={M.muted}
                  value={sentForm.answer}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, answer: v }))}
                />
                <TextInput
                  style={inputStyle}
                  placeholder={t("educator.sentences.englishPlaceholder")}
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
                        {k === "blank" ? t("educator.sentences.kindBlank") : t("educator.sentences.kindEquivalent")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {sentForm.kind === "equivalent" && (
                  <TextInput
                    style={inputStyle}
                    placeholder={t("educator.sentences.literalPlaceholder")}
                    placeholderTextColor={M.muted}
                    value={sentForm.literalTranslation}
                    onChangeText={(v) => setSentForm((f) => ({ ...f, literalTranslation: v }))}
                  />
                )}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    label={sentEditing ? t("educator.sentences.update") : t("educator.sentences.add")}
                    onPress={handleSentSubmit}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  {sentEditing && (
                    <Button
                      label={t("common.cancel")}
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
                      <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>{t("educator.sentences.answerLabel")} <Text style={{ fontWeight: "700", color: M.accent }}>{item.answer}</Text></Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{item.englishSentence}</Text>
                      <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: item.kind === "equivalent" ? M.infoBg : M.accentGlow }}>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: item.kind === "equivalent" ? M.info : M.accent }}>{item.kind === "equivalent" ? t("educator.sentences.kindEquivalent") : t("educator.sentences.kindBlank")}</Text>
                        </View>
                        {item.literalTranslation && (
                          <Text style={{ fontSize: 10, color: M.muted }}>{t("educator.sentences.literalGloss", { text: item.literalTranslation })}</Text>
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
                <Text style={{ textAlign: "center", color: M.muted, fontSize: 13, marginTop: 12 }}>{t("educator.sentences.empty")}</Text>
              )}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Scenario form */}
              <View style={{ marginBottom: 20, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 10 }}>
                  {scenEditing ? t("educator.scenarios.editTitle") : t("educator.scenarios.addTitle")}
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("educator.scenarios.situationPlaceholder")}
                  placeholderTextColor={M.muted}
                  value={scenForm.situation}
                  onChangeText={(v) => setScenForm((f) => ({ ...f, situation: v }))}
                />
                <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 6, letterSpacing: 1 }}>
                  {t("educator.scenarios.turnsLabel")}
                </Text>
                {scenForm.turns.map((turn, idx) => (
                  <View key={idx} style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: M.border, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: M.muted, marginBottom: 4 }}>{t("educator.scenarios.turnLabel", { number: idx + 1 })}</Text>
                    <TextInput
                      style={{ ...inputStyle, marginBottom: 4 }}
                      placeholder={t("educator.scenarios.nativePlaceholder")}
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
                      placeholder={t("educator.scenarios.translationPlaceholder")}
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
                        <Text style={{ fontSize: 11, color: M.error }}>{t("educator.scenarios.removeTurn")}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable
                  onPress={() => setScenForm((f) => ({ ...f, turns: [...f.turns, { text: "", translation: "" }] }))}
                  style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <IconSymbol name="plus.circle" size={14} color={M.accent} />
                  <Text style={{ fontSize: 13, color: M.accent, fontWeight: "600" }}>{t("educator.scenarios.addTurn")}</Text>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button label={scenEditing ? t("educator.scenarios.update") : t("educator.scenarios.add")} onPress={handleScenSubmit} style={{ flex: 1 }} size="sm" />
                  {scenEditing && (
                    <Button
                      label={t("common.cancel")}
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
                <Text style={{ textAlign: "center", color: M.muted, fontSize: 13, marginTop: 12 }}>{t("educator.scenarios.empty")}</Text>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
