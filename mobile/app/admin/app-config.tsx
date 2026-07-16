import { IconSymbol } from "@/components/ui/icon-symbol";
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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile (admin) — App config / feature-flag editor. Plain key/value
 * rows backed by /admin/config. Admin-only via the section _layout gate.
 */

export default function AppConfigScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const configQuery = useAppConfig();
  const upsert = useUpsertConfig();
  const remove = useDeleteConfig();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

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
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>App config</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Feature flags and runtime key/value settings.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add flag */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 16, gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>Add flag</Text>
          <LabeledInput label="Key" value={newKey} onChange={setNewKey} />
          <LabeledInput label="Value" value={newValue} onChange={setNewValue} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : "Add flag"} onPress={handleAdd} M={M} />
          </View>
        </View>

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
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14, gap: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: M.text }}>{entry.key}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholderTextColor={M.inputPlaceholder}
        autoCapitalize="none"
        style={{
          borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
          backgroundColor: M.inputBg, color: M.inputText,
          paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
        }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <SmallButton label="Save" onPress={() => onSave(value)} M={M} />
        <SmallButton label="Delete" tone="danger" onPress={onDelete} M={M} />
      </View>
    </View>
  );
}

function LabeledInput({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={M.inputPlaceholder}
        autoCapitalize="none"
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

function SmallButton({ label, onPress, tone, M }: Readonly<{ label: string; onPress: () => void; tone?: "publish" | "danger"; M: M }>) {
  const color = tone === "publish" ? M.success : tone === "danger" ? M.error : M.sub;
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: M.card, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
