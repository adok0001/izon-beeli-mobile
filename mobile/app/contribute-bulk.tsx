import { useMuseumTheme } from "@/lib/use-museum-theme";
import { friendlyError } from "@/lib/api";
import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePicker } from "@/components/ui/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { LANGUAGES } from "@/lib/mock-data";
import { ALL_CATEGORIES, CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { useBulkSubmitContribution, type BulkContributionEntry } from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { useTranslation } from "react-i18next";

type Step = "language" | "category" | "entries";

interface EntryRow {
  word: string;
  english: string;
  pronunciation: string;
}

const EMPTY_ROW = (): EntryRow => ({ word: "", english: "", pronunciation: "" });

export default function ContributeBulkScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const submitBulk = useBulkSubmitContribution();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [step, setStep] = useState<Step>("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DictionaryCategory | null>(null);
  const [rows, setRows] = useState<EntryRow[]>([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);

  // Refs for focus management: [rowIndex][fieldIndex (0=word,1=english,2=pronunciation)]
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const refKey = (row: number, field: number) => `${row}-${field}`;

  const updateRow = (index: number, field: keyof EntryRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, EMPTY_ROW()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const focusNext = (rowIndex: number, fieldIndex: number) => {
    // Try next field in same row, then first field of next row
    const nextField = fieldIndex + 1;
    if (nextField <= 2) {
      inputRefs.current[refKey(rowIndex, nextField)]?.focus();
    } else {
      const nextRow = rowIndex + 1;
      if (nextRow < rows.length) {
        inputRefs.current[refKey(nextRow, 0)]?.focus();
      } else {
        // Last field of last row — add a new row and focus it
        setRows((prev) => {
          const next = [...prev, EMPTY_ROW()];
          // Focus happens in next render
          setTimeout(() => {
            inputRefs.current[refKey(next.length - 1, 0)]?.focus();
          }, 50);
          return next;
        });
      }
    }
  };

  const filledRows = rows.filter((r) => r.word.trim() && r.english.trim());

  const handleSubmit = () => {
    if (!selectedLanguage || !selectedCategory || filledRows.length === 0) return;

    const entries: BulkContributionEntry[] = filledRows.map((r) => ({
      word: r.word.trim(),
      english: r.english.trim(),
      category: selectedCategory,
      pronunciation: r.pronunciation.trim() || undefined,
    }));

    submitBulk.mutate(
      { languageId: selectedLanguage, entries },
      {
        onSuccess: (data) => {
          const label = data.inserted === 1 ? t("contribute.submitEntry") : t("contribute.submitEntries");
          toastSuccess(
            t("contribute.submitted"),
            t("contribute.submittedBulkDesc", { inserted: data.inserted, label })
          );
          setTimeout(() => router.back(), 1500);
        },
        onError: (err) => {
          toastError(t("common.error"), friendlyError(err));
        },
      }
    );
  };

  const steps: Step[] = ["language", "category", "entries"];
  const stepIndex = steps.indexOf(step);
  const languageName = LANGUAGES.find((l) => l.id === selectedLanguage)?.name ?? "";

  return (
    <>
      <Stack.Screen options={{ title: t("contribute.bulkTitle"), presentation: "modal" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Progress bar */}
          <View className="flex-row gap-1 px-5 pt-2">
            {steps.map((s, i) => (
              <View
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  stepIndex >= i ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </View>

          {step === "language" ? (
            <LanguagePicker
              value={selectedLanguage ?? ""}
              onSelect={(id) => {
                setSelectedLanguage(id);
                setStep("category");
              }}
              languages={LANGUAGES}
              title={t("contribute.selectLanguage")}
              subtitle={t("contribute.allEntriesLanguageDesc")}
            />
          ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Step 2: Category ── */}
            {step === "category" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  Choose a category
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  Applied to all entries — you can change this later
                </Text>
                {ALL_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setStep("entries");
                    }}
                    className={`mb-2 flex-row items-center rounded-2xl p-4 active:opacity-70 ${
                      selectedCategory === cat
                        ? "bg-green-50 dark:bg-green-950"
                        : "bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Text className="flex-1 text-base text-neutral-900 dark:text-white">
                      {CATEGORY_LABELS[cat]}
                    </Text>
                    {selectedCategory === cat && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={M.success} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── Step 3: Entries ── */}
            {step === "entries" && (
              <View>
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                      {t("contribute.addEntries")}
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {languageName} · {selectedCategory ? CATEGORY_LABELS[selectedCategory] : ""}
                    </Text>
                  </View>
                  <View className="rounded-full bg-green-100 px-3 py-1 dark:bg-green-900">
                    <Text className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {t("contribute.readyCount", { count: filledRows.length })}
                    </Text>
                  </View>
                </View>

                {/* Column headers */}
                <View className="mb-1.5 flex-row gap-2 px-1">
                  <Text className="flex-[2] text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t("contribute.nativeWord")}
                  </Text>
                  <Text className="flex-[2] text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t("wordReview.english")}
                  </Text>
                  <Text className="flex-[1] text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t("contribute.pronunciationShort")}
                  </Text>
                  <View className="w-7" />
                </View>

                {rows.map((row, i) => (
                  <View key={i} className="mb-2 flex-row items-center gap-2">
                    <TextInput
                      ref={(r) => { inputRefs.current[refKey(i, 0)] = r; }}
                      value={row.word}
                      onChangeText={(v) => updateRow(i, "word", v)}
                      placeholder={t("contribute.wordPlaceholder")}
                      placeholderTextColor={M.muted}
                      returnKeyType="next"
                      onSubmitEditing={() => focusNext(i, 0)}
                      blurOnSubmit={false}
                      className="flex-[2] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <TextInput
                      ref={(r) => { inputRefs.current[refKey(i, 1)] = r; }}
                      value={row.english}
                      onChangeText={(v) => updateRow(i, "english", v)}
                      placeholder={t("contribute.translationPlaceholder")}
                      placeholderTextColor={M.muted}
                      returnKeyType="next"
                      onSubmitEditing={() => focusNext(i, 1)}
                      blurOnSubmit={false}
                      className="flex-[2] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <TextInput
                      ref={(r) => { inputRefs.current[refKey(i, 2)] = r; }}
                      value={row.pronunciation}
                      onChangeText={(v) => updateRow(i, "pronunciation", v)}
                      placeholder="e.g. /tɪm/"
                      placeholderTextColor={M.muted}
                      returnKeyType="next"
                      onSubmitEditing={() => focusNext(i, 2)}
                      blurOnSubmit={false}
                      className="flex-[1] rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <Pressable
                      onPress={() => removeRow(i)}
                      className="h-8 w-7 items-center justify-center"
                    >
                      <IconSymbol
                        name={rows.length > 1 ? "xmark" : "minus"}
                        size={12}
                        color={rows.length > 1 ? M.muted : M.border}
                      />
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  onPress={addRow}
                  className="mb-8 mt-1 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-3.5 active:opacity-70 dark:border-neutral-700"
                >
                  <IconSymbol name="plus.circle.fill" size={16} color={M.success} />
                  <Text className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">
                    {t("contribute.addRow")}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
          )}

          {/* Bottom bar (only shown on entries step) */}
          {step === "entries" && (
            <View className="border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setStep("category")}
                  className="flex-row items-center justify-center rounded-2xl bg-neutral-100 px-5 py-3.5 active:opacity-80 dark:bg-neutral-800"
                >
                  <IconSymbol name="chevron.left" size={14} color={M.sub} />
                  <Text className="ml-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("common.back")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitBulk.isPending || filledRows.length === 0}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
                    !submitBulk.isPending && filledRows.length > 0
                      ? "bg-green-500"
                      : "bg-green-200 dark:bg-green-900"
                  }`}
                >
                  {submitBulk.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <IconSymbol name="paperplane.fill" size={14} color="white" />
                      <Text className="ml-2 font-semibold text-white">
                        {t("common.submit")}{filledRows.length > 0 ? ` ${filledRows.length} ` : " "}
                        {filledRows.length === 1 ? t("contribute.submitEntry") : t("contribute.submitEntries")}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
