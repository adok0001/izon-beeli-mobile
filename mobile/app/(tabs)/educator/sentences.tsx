import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
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
import { ActiveToggle } from "@/components/studio/active-toggle";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { FormInput, GhostButton, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { LANGUAGES } from "@/lib/mock-data";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { data: sentences = [], isLoading: sentLoading, refetch: refetchSentences } = useEducatorSentences(selectedLanguage);
  const upsertSentence = useUpsertSentence();
  const deleteSentence = useDeleteSentence();
  const [sentForm, setSentForm] = useState<SentenceForm>(EMPTY_SENTENCE);
  const [sentEditing, setSentEditing] = useState(false);

  // Scenarios state
  const { data: scenarios = [], isLoading: scenLoading, refetch: refetchScenarios } = useEducatorScenarios(selectedLanguage);
  const createScenario = useCreateScenario();
  const updateScenario = useUpdateScenario();
  const deleteScenario = useDeleteScenario();
  const [scenForm, setScenForm] = useState<ScenarioForm>(EMPTY_SCENARIO);
  const [scenEditing, setScenEditing] = useState(false);

  // Both forms live inline on the screen and reset to empty on save, so unsaved
  // work is exactly a form that has drifted from its empty template (editing an
  // existing row loads its values, which also counts — leaving would lose them).
  const formsDirty =
    JSON.stringify(sentForm) !== JSON.stringify(EMPTY_SENTENCE) ||
    JSON.stringify(scenForm) !== JSON.stringify(EMPTY_SCENARIO);
  useUnsavedGuard(formsDirty);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSentences(), refetchScenarios()]);
    setRefreshing(false);
  }, [refetchSentences, refetchScenarios]);

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <NotificationBanner
          visible={toast.toast.visible}
          title={toast.toast.title}
          body={toast.toast.body}
          type={toast.toast.type}
          onDismiss={toast.dismiss}
        />
        <StudioScreenHeader title={t("educator.sentences.screenTitle")} />
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: M.card }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Language picker */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <StudioFilterPills
              options={LANGUAGES.map((lang) => ({ id: lang.id, label: lang.name }))}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              scrollable
            />
          </View>

          {/* Tab switcher */}
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <StudioFilterPills<Tab>
              options={[
                { id: "sentences", label: t("educator.sentences.tabSentences") },
                { id: "scenarios", label: t("educator.sentences.tabScenarios") },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>

          {tab === "sentences" ? (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
            >
              {/* Sentence form */}
              <StudioCard style={{ gap: 8, marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 2 }}>
                  {sentEditing ? t("educator.sentences.editTitle") : t("educator.sentences.addTitle")}
                </Text>
                <FormInput
                  placeholder={t("educator.sentences.sentencePlaceholder")}
                  value={sentForm.sentence}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, sentence: v }))}
                />
                <FormInput
                  placeholder={t("educator.sentences.answerPlaceholder")}
                  value={sentForm.answer}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, answer: v }))}
                />
                <FormInput
                  placeholder={t("educator.sentences.englishPlaceholder")}
                  value={sentForm.englishSentence}
                  onChangeText={(v) => setSentForm((f) => ({ ...f, englishSentence: v }))}
                />
                {/* Kind selector */}
                <StudioFilterPills<SentenceForm["kind"]>
                  options={[
                    { id: "blank", label: t("educator.sentences.kindBlank") },
                    { id: "equivalent", label: t("educator.sentences.kindEquivalent") },
                  ]}
                  value={sentForm.kind}
                  onChange={(kind) => setSentForm((f) => ({ ...f, kind }))}
                />
                {sentForm.kind === "equivalent" && (
                  <FormInput
                    placeholder={t("educator.sentences.literalPlaceholder")}
                    value={sentForm.literalTranslation}
                    onChangeText={(v) => setSentForm((f) => ({ ...f, literalTranslation: v }))}
                  />
                )}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton label={sentEditing ? t("educator.sentences.update") : t("educator.sentences.add")} onPress={handleSentSubmit} />
                  </View>
                  {sentEditing && (
                    <View style={{ flex: 1 }}>
                      <GhostButton label={t("common.cancel")} onPress={() => { setSentForm(EMPTY_SENTENCE); setSentEditing(false); }} />
                    </View>
                  )}
                </View>
              </StudioCard>

              {/* Sentence list */}
              <View style={{ gap: 10 }}>
                {sentences.map((item) => (
                  <StudioCard key={item.id}>
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
                      <View style={{ gap: 6, alignItems: "flex-end" }}>
                        <ActiveToggle
                          entityType="sentence_templates"
                          id={item.id}
                          isActive={item.isActive ?? true}
                          invalidateKeys={[["educator", "sentences"], ["sentences"]]}
                          M={M}
                          onToast={{ success: toast.success, error: toast.error }}
                        />
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <ActionPill icon="pencil" label={t("common.edit")} onPress={() => handleSentEdit(item)} />
                          <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={() => handleSentDelete(item)} />
                        </View>
                      </View>
                    </View>
                  </StudioCard>
                ))}
              </View>
              {!sentLoading && sentences.length === 0 && (
                <Text style={{ textAlign: "center", color: M.muted, fontSize: 13, marginTop: 12 }}>{t("educator.sentences.empty")}</Text>
              )}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
            >
              {/* Scenario form */}
              <StudioCard style={{ gap: 8, marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: M.text, marginBottom: 2 }}>
                  {scenEditing ? t("educator.scenarios.editTitle") : t("educator.scenarios.addTitle")}
                </Text>
                <FormInput
                  placeholder={t("educator.scenarios.situationPlaceholder")}
                  value={scenForm.situation}
                  onChangeText={(v) => setScenForm((f) => ({ ...f, situation: v }))}
                />
                <Text style={{ fontSize: 11, fontWeight: "600", color: M.muted, marginBottom: 2, letterSpacing: 1 }}>
                  {t("educator.scenarios.turnsLabel")}
                </Text>
                {scenForm.turns.map((turn, idx) => (
                  <View key={idx} style={{ marginBottom: 4, borderRadius: 8, borderWidth: 1, borderColor: M.border, padding: 10, gap: 6 }}>
                    <Text style={{ fontSize: 10, color: M.muted }}>{t("educator.scenarios.turnLabel", { number: idx + 1 })}</Text>
                    <FormInput
                      placeholder={t("educator.scenarios.nativePlaceholder")}
                      value={turn.text}
                      onChangeText={(v) => setScenForm((f) => {
                        const turns = [...f.turns];
                        turns[idx] = { ...turns[idx], text: v };
                        return { ...f, turns };
                      })}
                    />
                    <FormInput
                      placeholder={t("educator.scenarios.translationPlaceholder")}
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
                        style={{ alignSelf: "flex-end" }}
                      >
                        <Text style={{ fontSize: 11, color: M.error }}>{t("educator.scenarios.removeTurn")}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable
                  onPress={() => setScenForm((f) => ({ ...f, turns: [...f.turns, { text: "", translation: "" }] }))}
                  style={{ marginBottom: 2, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <IconSymbol name="plus.circle" size={14} color={M.accent} />
                  <Text style={{ fontSize: 13, color: M.accent, fontWeight: "600" }}>{t("educator.scenarios.addTurn")}</Text>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton label={scenEditing ? t("educator.scenarios.update") : t("educator.scenarios.add")} onPress={handleScenSubmit} />
                  </View>
                  {scenEditing && (
                    <View style={{ flex: 1 }}>
                      <GhostButton label={t("common.cancel")} onPress={() => { setScenForm(EMPTY_SCENARIO); setScenEditing(false); }} />
                    </View>
                  )}
                </View>
              </StudioCard>

              {/* Scenario list */}
              <View style={{ gap: 10 }}>
                {scenarios.map((item) => (
                  <StudioCard key={item.id}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: M.text, marginRight: 8 }}>{item.situation}</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <ActionPill icon="pencil" label={t("common.edit")} onPress={() => handleScenEdit(item)} />
                        <ActionPill icon="trash.fill" label={t("common.delete")} tone="danger" onPress={() => handleScenDelete(item)} />
                      </View>
                    </View>
                    {item.turns.map((turn, i) => (
                      <View key={i} style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: M.sub }}>{turn.text}</Text>
                        <Text style={{ fontSize: 11, color: M.muted, fontStyle: "italic" }}>{turn.translation}</Text>
                      </View>
                    ))}
                  </StudioCard>
                ))}
              </View>
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
