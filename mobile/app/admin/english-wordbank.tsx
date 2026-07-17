import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
import { friendlyError } from "@/lib/api";
import {
  useDeleteWordbankEntry,
  useEnglishWordbank,
  useUpsertWordbankEntry,
  type WordbankEntry,
} from "@/lib/hooks/educator/use-english-wordbank";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — English wordbank (admin). Simple CRUD against
 * /english-wordbank/admin. No editorial workflow: reference vocabulary data.
 */

type WordbankForm = {
  id: string;
  word: string;
  definition: string;
  category: string;
  posType: string;
  isNew: boolean;
};

const EMPTY_FORM: WordbankForm = {
  id: "",
  word: "",
  definition: "",
  category: "",
  posType: "",
  isNew: true,
};

export default function EnglishWordbankScreen() {
  const M = useMuseumTheme();
  useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<WordbankForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);

  const wordbankQuery = useEnglishWordbank(search.trim() || undefined);
  const upsert = useUpsertWordbankEntry();
  const remove = useDeleteWordbankEntry();

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(e: WordbankEntry) {
    setForm({
      id: e.id,
      word: e.word,
      definition: e.definition ?? "",
      category: e.category,
      posType: e.posType ?? "",
      isNew: false,
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.id.trim() || !form.word.trim() || !form.category.trim()) {
      toastError("Missing fields", "Id, word, and category are required.");
      return;
    }
    upsert.mutate(
      {
        id: form.id.trim(),
        word: form.word.trim(),
        definition: form.definition.trim() || undefined,
        category: form.category.trim(),
        posType: form.posType.trim() || undefined,
        isNew: form.isNew,
      },
      {
        onSuccess: () => {
          toastSuccess(form.isNew ? "Entry created" : "Entry updated");
          resetForm();
        },
        onError: (err: Error) => toastError("Save failed", friendlyError(err, err.message)),
      }
    );
  }

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
        title="English wordbank"
        subtitle="Reference English vocabulary entries."
        action={{ label: "New entry", icon: "plus", onPress: openNew }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={{ marginBottom: 16 }}>
          <StudioSearchInput value={search} onChangeText={setSearch} placeholder="Search words…" />
        </View>

        {/* Editor form */}
        {formOpen && (
        <StudioCard style={{ gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
            {form.isNew ? "New entry" : "Edit entry"}
          </Text>
          {form.isNew ? (
            <LabeledInput label="Id *" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          ) : (
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>Id</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.muted }}>{form.id}</Text>
            </View>
          )}
          <LabeledInput label="Word *" value={form.word} onChange={(v) => setForm({ ...form, word: v })} />
          <LabeledInput label="Definition" value={form.definition} onChange={(v) => setForm({ ...form, definition: v })} />
          <LabeledInput label="Category *" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <LabeledInput label="Part of speech" value={form.posType} onChange={(v) => setForm({ ...form, posType: v })} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : form.isNew ? "Create" : "Save"} onPress={handleSave} />
            <GhostButton label="Cancel" onPress={resetForm} />
          </View>
        </StudioCard>
        )}

        {/* List */}
        {wordbankQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {wordbankQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No entries found.</Text>
        )}
        <View style={{ gap: 10 }}>
          {wordbankQuery.data?.map((e) => (
            <StudioCard key={e.id}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{e.word}</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {e.category}{e.posType ? ` · ${e.posType}` : ""}
              </Text>
              {e.definition ? (
                <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{e.definition}</Text>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <ActionPill icon="pencil" label="Edit" onPress={() => startEdit(e)} />
                <ActionPill
                  icon="trash.fill"
                  label="Delete"
                  tone="danger"
                  onPress={() =>
                    remove.mutate(e.id, {
                      onSuccess: () => toastSuccess("Deleted"),
                      onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
                    })
                  }
                />
              </View>
            </StudioCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
