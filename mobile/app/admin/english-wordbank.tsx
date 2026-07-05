import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import {
  useDeleteWordbankEntry,
  useEnglishWordbank,
  useUpsertWordbankEntry,
  type WordbankEntry,
} from "@/lib/hooks/educator/use-english-wordbank";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  const router = useRouter();
  useStudioAccess();
  const { success: toastSuccess, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<WordbankForm>(EMPTY_FORM);

  const wordbankQuery = useEnglishWordbank(search.trim() || undefined);
  const upsert = useUpsertWordbankEntry();
  const remove = useDeleteWordbankEntry();

  function resetForm() {
    setForm(EMPTY_FORM);
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>English wordbank</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Reference English vocabulary entries.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={{ marginBottom: 16 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search words…"
            placeholderTextColor={M.inputPlaceholder}
            style={{
              borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
              backgroundColor: M.inputBg, color: M.inputText,
              paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
            }}
          />
        </View>

        {/* Editor form */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
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
            <PrimaryButton label={upsert.isPending ? "Saving…" : form.isNew ? "Create" : "Save"} onPress={handleSave} M={M} />
            {!form.isNew && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {wordbankQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {wordbankQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No entries found.</Text>
        )}
        <View style={{ gap: 10 }}>
          {wordbankQuery.data?.map((e) => (
            <View key={e.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{e.word}</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {e.category}{e.posType ? ` · ${e.posType}` : ""}
              </Text>
              {e.definition ? (
                <Text style={{ marginTop: 2, fontSize: 12, color: M.muted }}>{e.definition}</Text>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <SmallButton label="Edit" onPress={() => startEdit(e)} M={M} />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(e.id, {
                    onSuccess: () => toastSuccess("Deleted"),
                    onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
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

function SmallButton({ label, onPress, tone, M }: Readonly<{ label: string; onPress: () => void; tone?: "danger"; M: M }>) {
  const color = tone === "danger" ? M.error : M.sub;
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
