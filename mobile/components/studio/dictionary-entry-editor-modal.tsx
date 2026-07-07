import { ReplicaDictionaryEntry } from "@/components/studio/replica/replica-dictionary-entry";
import { SchedulePublishModal } from "@/components/studio/schedule-publish-modal";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import { DICTIONARY_CATEGORY_VALUES, splitList, type DialectalVariant } from "@/lib/dictionary";
import {
  canPublishContent,
  canSubmitForReview,
  isScheduled,
  STATUS_LABEL,
  STATUS_TONE,
  type EducatorDictionaryCategory,
  type EducatorDictionaryEntry,
  type WorkflowActor,
  usePatchEducatorDictionaryField,
  useDeleteEducatorDictionaryEntry,
  usePublishContent,
  useSchedulePublishContent,
  useSubmitEducatorDictionaryForReview,
  useUnschedulePublishContent,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Repeatable dialect / form / region rows for editing dialectal variants. */
export function VariantRows({ value, onChange }: { value: DialectalVariant[]; onChange: (v: DialectalVariant[]) => void }) {
  const M = useMuseumTheme();
  const update = (i: number, patch: Partial<DialectalVariant>) =>
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const inputClass = "flex-1 rounded-lg bg-white px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-white";
  return (
    <View className="mt-2">
      <Text className="mb-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Dialectal variants (optional)</Text>
      {value.map((variant, i) => (
        <View key={i} className="mb-2 flex-row items-center gap-1.5">
          <TextInput value={variant.dialect} onChangeText={(dialect) => update(i, { dialect })} placeholder="Dialect" placeholderTextColor={M.muted} className={inputClass} />
          <TextInput value={variant.form} onChangeText={(form) => update(i, { form })} placeholder="Form" placeholderTextColor={M.muted} className={inputClass} />
          <TextInput value={variant.region ?? ""} onChangeText={(region) => update(i, { region })} placeholder="Region" placeholderTextColor={M.muted} className={inputClass} />
          <Pressable onPress={() => onChange(value.filter((_, idx) => idx !== i))} hitSlop={8} className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
            <IconSymbol name="xmark" size={12} color={M.error} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...value, { dialect: "", form: "" }])} className="mt-1 flex-row items-center self-start rounded-full bg-neutral-200 px-3 py-1.5 dark:bg-neutral-700">
        <IconSymbol name="plus" size={12} color={M.text} />
        <Text className="ml-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">Add variant</Text>
      </Pressable>
    </View>
  );
}

/** The structured fields with no natural in-place spot in the replica (single-select
 * category, list-shaped lexical detail) — kept as a plain form, per the live-replica
 * plan's "side inspector" carve-out, distinct from the replica's per-field autosave. */
const CATEGORIES: EducatorDictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];

function MoreDetailsSection({ entry }: { entry: EducatorDictionaryEntry }) {
  const M = useMuseumTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const patchField = usePatchEducatorDictionaryField();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    category: entry.category,
    synonyms: (entry.synonyms ?? []).join(", "),
    antonyms: (entry.antonyms ?? []).join(", "),
    semanticDomain: entry.semanticDomain ?? "",
    dialectalVariants: entry.dialectalVariants ?? [],
  });

  const save = () => {
    patchField.mutate(
      {
        id: entry.id,
        category: fields.category,
        synonyms: splitList(fields.synonyms),
        antonyms: splitList(fields.antonyms),
        semanticDomain: fields.semanticDomain.trim() || undefined,
        dialectalVariants: fields.dialectalVariants.filter((v) => v.dialect.trim() && v.form.trim()),
      },
      {
        onSuccess: () => toastSuccess("Details saved"),
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
      },
    );
  };

  return (
    <View className="mx-5 mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-white">More details</Text>
        <IconSymbol name={open ? "chevron.up" : "chevron.down"} size={14} color={M.muted} />
      </Pressable>
      {open && (
        <View className="mt-3">
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = fields.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setFields((prev) => ({ ...prev, category }))}
                  className={`rounded-full px-3 py-1.5 ${active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"}`}
                >
                  <Text className={`text-xs font-semibold uppercase ${active ? "text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={fields.synonyms}
            onChangeText={(synonyms) => setFields((prev) => ({ ...prev, synonyms }))}
            placeholder="Synonyms (comma-separated, optional)"
            placeholderTextColor={M.muted}
            className="mt-3 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
          />
          <TextInput
            value={fields.antonyms}
            onChangeText={(antonyms) => setFields((prev) => ({ ...prev, antonyms }))}
            placeholder="Antonyms (comma-separated, optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
          />
          <TextInput
            value={fields.semanticDomain}
            onChangeText={(semanticDomain) => setFields((prev) => ({ ...prev, semanticDomain }))}
            placeholder="Semantic domain, e.g. body > senses (optional)"
            placeholderTextColor={M.muted}
            className="mt-2 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
          />
          <VariantRows
            value={fields.dialectalVariants}
            onChange={(dialectalVariants) => setFields((prev) => ({ ...prev, dialectalVariants }))}
          />
          <Pressable
            onPress={save}
            disabled={patchField.isPending}
            className="mt-3 rounded-xl bg-blue-500 py-2.5 active:opacity-80"
          >
            <Text className="text-center text-sm font-semibold text-white">
              {patchField.isPending ? "Saving…" : "Save details"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface EntryEditorModalProps {
  entry: EducatorDictionaryEntry;
  actor: WorkflowActor;
  onClose: () => void;
}

/** Full-screen live-replica editor for one entry — replaces the old
 * form-in-a-modal pattern; publish/submit/delete stay as a persistent action
 * strip around the replica, per the live-replica plan. */
export function DictionaryEntryEditorModal({ entry, actor, onClose }: EntryEditorModalProps) {
  const M = useMuseumTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const submitForReview = useSubmitEducatorDictionaryForReview();
  const deleteEntry = useDeleteEducatorDictionaryEntry();
  const publishEntry = usePublishContent("dictionary_entries", [["educator", "dictionary"]]);
  const schedulePublishEntry = useSchedulePublishContent("dictionary_entries", [["educator", "dictionary"]]);
  const unschedulePublishEntry = useUnschedulePublishContent("dictionary_entries", [["educator", "dictionary"]]);
  const [schedulingOpen, setSchedulingOpen] = useState(false);

  const canPublish = canPublishContent(entry.status, entry.createdBy, actor);
  const scheduled = isScheduled(entry.status, entry.publishAt);

  const confirmDelete = () => {
    Alert.alert("Delete entry", "This will permanently delete this dictionary entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteEntry.mutate(entry.id, {
            onSuccess: () => { toastSuccess("Entry deleted"); onClose(); },
            onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
          }),
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable onPress={onClose} hitSlop={12} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.text} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {entry.status && <Badge label={STATUS_LABEL[entry.status]} tone={STATUS_TONE[entry.status]} />}
            {canSubmitForReview(entry.status) && (
              <Pressable
                onPress={() => submitForReview.mutate(entry.id, {
                  onSuccess: () => toastSuccess("Submitted for review"),
                  onError: (err: Error) => toastError("Submit failed", friendlyError(err)),
                })}
                disabled={submitForReview.isPending}
                className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/40"
              >
                <IconSymbol name="paperplane.fill" size={14} color={M.warning} />
              </Pressable>
            )}
            {canPublish && (
              <>
                <Pressable
                  onPress={() => publishEntry.mutate(entry.id, {
                    onSuccess: () => toastSuccess("Published"),
                    onError: (err: Error) => toastError("Publish failed", friendlyError(err)),
                  })}
                  disabled={publishEntry.isPending}
                  className="rounded-full bg-green-100 p-2 dark:bg-green-900/40"
                >
                  <IconSymbol name="checkmark.circle.fill" size={14} color={M.success} />
                </Pressable>
                <Pressable
                  onPress={() => (scheduled
                    ? unschedulePublishEntry.mutate(entry.id)
                    : setSchedulingOpen(true))}
                  className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/40"
                >
                  <IconSymbol name="clock.fill" size={14} color={M.info} />
                </Pressable>
              </>
            )}
            <Pressable onPress={confirmDelete} className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
              <IconSymbol name="xmark.circle.fill" size={14} color={M.error} />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <ReplicaDictionaryEntry
              entry={entry}
              actor={actor}
              onError={(err) => toastError("Save failed", friendlyError(err, err.message))}
            />
            <MoreDetailsSection key={entry.id} entry={entry} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {schedulingOpen && (
        <SchedulePublishModal
          onClose={() => setSchedulingOpen(false)}
          onSchedule={(publishAt) =>
            schedulePublishEntry.mutate(
              { id: entry.id, publishAt },
              { onSuccess: () => setSchedulingOpen(false) }
            )
          }
          saving={schedulePublishEntry.isPending}
        />
      )}
    </Modal>
  );
}
