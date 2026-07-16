import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import {
  useAdminLanguages,
  useDeleteLanguage,
  useUpsertLanguage,
  type Language,
} from "@/lib/hooks/educator/use-admin-languages";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile — Languages (admin). Simple CRUD against /languages/admin.
 * No editorial workflow: languages are structural data, not authored content.
 */

type LanguageForm = {
  id: string;
  name: string;
  nativeName: string;
  region: string;
  isActive: boolean;
  isNew: boolean;
};

const EMPTY_FORM: LanguageForm = {
  id: "",
  name: "",
  nativeName: "",
  region: "",
  isActive: true,
  isNew: true,
};

export default function LanguagesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState<LanguageForm>(EMPTY_FORM);

  const languagesQuery = useAdminLanguages();
  const upsert = useUpsertLanguage();
  const remove = useDeleteLanguage();

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(l: Language) {
    setForm({
      id: l.id,
      name: l.name,
      nativeName: l.nativeName,
      region: l.region,
      isActive: l.isActive,
      isNew: false,
    });
  }

  function handleSave() {
    if (!form.id.trim() || !form.name.trim() || !form.nativeName.trim() || !form.region.trim()) {
      toastError("Missing fields", "Id, name, native name, and region are all required.");
      return;
    }
    upsert.mutate(
      {
        id: form.id.trim(),
        name: form.name.trim(),
        nativeName: form.nativeName.trim(),
        region: form.region.trim(),
        isActive: form.isActive,
        isNew: form.isNew,
      },
      {
        onSuccess: () => {
          toastSuccess(form.isNew ? "Language created" : "Language updated");
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Languages</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Supported languages and their metadata.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editor form */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>
            {form.isNew ? "New language" : "Edit language"}
          </Text>
          {form.isNew ? (
            <LabeledInput label="Id *" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          ) : (
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>Id</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.muted }}>{form.id}</Text>
            </View>
          )}
          <LabeledInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <LabeledInput label="Native name *" value={form.nativeName} onChange={(v) => setForm({ ...form, nativeName: v })} />
          <LabeledInput label="Region *" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>Active</Text>
            <Switch
              value={form.isActive}
              onValueChange={(v) => setForm({ ...form, isActive: v })}
              trackColor={{ false: M.border, true: M.accent }}
              thumbColor={M.parchment}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : form.isNew ? "Create" : "Save"} onPress={handleSave} M={M} />
            {!form.isNew && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {languagesQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {languagesQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No languages yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {languagesQuery.data?.map((l) => (
            <View key={l.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{l.name}</Text>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: l.isActive ? M.successBg : M.card,
                    borderWidth: 1,
                    borderColor: l.isActive ? M.successBorder : M.border,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "800", color: l.isActive ? M.success : M.muted }}>
                    {l.isActive ? "ACTIVE" : "INACTIVE"}
                  </Text>
                </View>
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {l.nativeName} · {l.region} · {l.id}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <SmallButton label="Edit" onPress={() => startEdit(l)} M={M} />
                <SmallButton
                  label={l.isActive ? "Deactivate" : "Activate"}
                  onPress={() =>
                    upsert.mutate(
                      {
                        id: l.id,
                        name: l.name,
                        nativeName: l.nativeName,
                        region: l.region,
                        isActive: !l.isActive,
                        isNew: false,
                      },
                      {
                        onSuccess: () => toastSuccess(l.isActive ? "Language deactivated" : "Language activated"),
                        onError: (e: Error) => toastError("Update failed", friendlyError(e)),
                      }
                    )
                  }
                  M={M}
                />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(l.id, {
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

function SmallButton({ label, onPress, tone, M }: Readonly<{ label: string; onPress: () => void; tone?: "danger"; M: M }>) {
  const color = tone === "danger" ? M.error : M.sub;
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
