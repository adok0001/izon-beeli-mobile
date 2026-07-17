import { useStudioAccess } from "@/components/studio/studio-gate";
import { ActionPill, ActiveTogglePill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
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
import { useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
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
  useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState<LanguageForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);

  const languagesQuery = useAdminLanguages();
  const upsert = useUpsertLanguage();
  const remove = useDeleteLanguage();

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
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
    setFormOpen(true);
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
      <StudioScreenHeader
        title="Languages"
        subtitle="Supported languages and their metadata."
        action={{ label: "New language", icon: "plus", onPress: openNew }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editor form */}
        {formOpen && (
        <StudioCard style={{ gap: 10, marginBottom: 20 }}>
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
            <PrimaryButton label={upsert.isPending ? "Saving…" : form.isNew ? "Create" : "Save"} onPress={handleSave} />
            <GhostButton label="Cancel" onPress={resetForm} />
          </View>
        </StudioCard>
        )}

        {/* List */}
        {languagesQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {languagesQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No languages yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {languagesQuery.data?.map((l) => (
            <StudioCard key={l.id}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{l.name}</Text>
                <ActiveTogglePill
                  active={l.isActive}
                  pending={upsert.isPending}
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
                />
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {l.nativeName} · {l.region} · {l.id}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <ActionPill icon="pencil" label="Edit" onPress={() => startEdit(l)} />
                <ActionPill
                  icon="trash.fill"
                  label="Delete"
                  tone="danger"
                  onPress={() =>
                    remove.mutate(l.id, {
                      onSuccess: () => toastSuccess("Deleted"),
                      onError: (e: Error) => toastError("Delete failed", friendlyError(e)),
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
