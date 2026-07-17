import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { FormInput, GhostButton, LabeledInput, PrimaryButton } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { friendlyError } from "@/lib/api";
import {
  useAppConfig,
  useDeleteConfig,
  useUpsertConfig,
  type ConfigEntry,
} from "@/lib/hooks/educator/use-app-config";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile (admin) — App config / feature-flag editor. Plain key/value
 * rows backed by /admin/config. Admin-only via the section _layout gate.
 */

export default function AppConfigScreen() {
  const M = useMuseumTheme();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const configQuery = useAppConfig();
  const upsert = useUpsertConfig();
  const remove = useDeleteConfig();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);

  function handleAdd() {
    if (!newKey.trim()) {
      toastError("Missing key", "A flag key is required.");
      return;
    }
    upsert.mutate(
      { key: newKey.trim(), value: newValue },
      {
        onSuccess: () => {
          toastSuccess("Flag added");
          setNewKey("");
          setNewValue("");
          setAddFormOpen(false);
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
        title="App config"
        subtitle="Feature flags and runtime key/value settings."
        action={{ label: "New flag", icon: "plus", onPress: () => { setNewKey(""); setNewValue(""); setAddFormOpen(true); } }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add flag */}
        {addFormOpen && (
        <StudioCard style={{ gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>Add flag</Text>
          <LabeledInput label="Key" value={newKey} onChange={setNewKey} />
          <LabeledInput label="Value" value={newValue} onChange={setNewValue} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={upsert.isPending ? "Saving…" : "Add flag"} onPress={handleAdd} />
            </View>
            <GhostButton label="Cancel" onPress={() => setAddFormOpen(false)} />
          </View>
        </StudioCard>
        )}

        {/* List */}
        {configQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {configQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No flags configured yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {configQuery.data?.map((entry) => (
            <ConfigRow
              key={entry.key}
              entry={entry}
              M={M}
              onSave={(value) =>
                upsert.mutate(
                  { key: entry.key, value },
                  {
                    onSuccess: () => toastSuccess("Saved"),
                    onError: (e: Error) => toastError("Save failed", friendlyError(e)),
                  }
                )
              }
              onDelete={() =>
                remove.mutate(entry.key, {
                  onSuccess: () => toastSuccess("Deleted"),
                  onError: (e: Error) => toastError("Delete failed", friendlyError(e)),
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type M = ReturnType<typeof useMuseumTheme>;

function ConfigRow({ entry, onSave, onDelete, M }: Readonly<{ entry: ConfigEntry; onSave: (value: string) => void; onDelete: () => void; M: M }>) {
  const [value, setValue] = useState(entry.value);

  // Keep the local draft in sync when the underlying flag changes (e.g. refetch).
  useEffect(() => {
    setValue(entry.value);
  }, [entry.value]);

  return (
    <StudioCard style={{ gap: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>{entry.key}</Text>
      <FormInput value={value} onChangeText={setValue} autoCapitalize="none" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <ActionPill label="Save" onPress={() => onSave(value)} />
        <ActionPill label="Delete" tone="danger" onPress={onDelete} />
      </View>
    </StudioCard>
  );
}
