import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import {
  canPublishContent,
  STATUS_LABEL,
  STATUS_TONE,
  usePublishContent,
  type ContentStatus,
} from "@/lib/hooks/educator/use-content-workflow";
import {
  useContentPartners,
  useDeletePartner,
  useTogglePartner,
  useUpsertPartner,
  type Partner,
} from "@/lib/hooks/educator/use-content-partners";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Studio Mobile (admin) — Content partners registry. Universities, research
 * groups, and institutions credited across the platform. Admin-only: no
 * language scoping. CRUD + publish/activate against /partners/admin.
 */

type PartnerForm = {
  id?: string;
  name: string;
  type: string;
  region: string;
  url: string;
  logoUrl: string;
  languageIds: string;
};

const EMPTY_FORM: PartnerForm = {
  name: "",
  type: "",
  region: "",
  url: "",
  logoUrl: "",
  languageIds: "",
};

export default function ContentPartnersScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { user } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);
  const editing = !!form.id;

  const partnersQuery = useContentPartners();
  const upsert = useUpsertPartner();
  const remove = useDeletePartner();
  const toggle = useTogglePartner();
  const publish = usePublishContent("content_partners", [["content-partners", "admin"]]);

  const actor = { isAdmin: user.isAdmin, reviewerRole: user.reviewerRole, userId: user.id };

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(p: Partner) {
    setForm({
      id: p.id,
      name: p.name,
      type: p.type,
      region: p.region ?? "",
      url: p.url ?? "",
      logoUrl: p.logoUrl ?? "",
      languageIds: (p.languageIds ?? []).join(", "),
    });
  }

  function handleSave() {
    if (!form.name.trim() || !form.type.trim()) {
      toastError("Missing fields", "Name and type are required.");
      return;
    }
    if (!editing && !form.id?.trim()) {
      toastError("Missing id", "An id is required to create a partner.");
      return;
    }
    upsert.mutate(
      {
        id: form.id?.trim(),
        isNew: !editing,
        name: form.name.trim(),
        type: form.type.trim(),
        region: form.region.trim() || null,
        url: form.url.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        languageIds: form.languageIds.split(",").map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toastSuccess(editing ? "Partner updated" : "Partner created");
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
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Content partners</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Universities, research groups, and institutions.</Text>
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
            {editing ? "Edit partner" : "New partner"}
          </Text>
          {!editing && (
            <LabeledInput label="ID *" value={form.id ?? ""} onChange={(v) => setForm({ ...form, id: v })} />
          )}
          <LabeledInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <LabeledInput label="Type *" hint="university | research | institution" value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
          <LabeledInput label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
          <LabeledInput label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
          <LabeledInput label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
          <LabeledInput label="Language IDs (comma-separated)" value={form.languageIds} onChange={(v) => setForm({ ...form, languageIds: v })} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <PrimaryButton label={upsert.isPending ? "Saving…" : editing ? "Save" : "Create partner"} onPress={handleSave} M={M} />
            {editing && <GhostButton label="Cancel" onPress={resetForm} M={M} />}
          </View>
        </View>

        {/* List */}
        {partnersQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {partnersQuery.data?.length === 0 && (
          <Text style={{ color: M.muted, fontSize: 13 }}>No partners yet.</Text>
        )}
        <View style={{ gap: 10 }}>
          {partnersQuery.data?.map((p) => (
            <View key={p.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: M.text }}>{p.name}</Text>
                {p.status && <Badge label={STATUS_LABEL[p.status as ContentStatus]} tone={STATUS_TONE[p.status as ContentStatus]} />}
              </View>
              <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
                {p.type}{p.region ? ` · ${p.region}` : ""}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: p.isActive ? M.success : M.muted }} />
                <Text style={{ fontSize: 12, color: p.isActive ? M.success : M.muted, fontWeight: "700" }}>
                  {p.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {canPublishContent(p.status, p.createdBy, actor) && (
                  <SmallButton label="Publish" tone="publish" onPress={() =>
                    publish.mutate(p.id, {
                      onSuccess: () => toastSuccess("Published"),
                      onError: (e: Error) => toastError("Publish failed", friendlyError(e)),
                    })
                  } M={M} />
                )}
                <SmallButton label={p.isActive ? "Deactivate" : "Activate"} onPress={() =>
                  toggle.mutate({ id: p.id, isActive: !p.isActive }, {
                    onSuccess: () => toastSuccess(p.isActive ? "Deactivated" : "Activated"),
                    onError: (e: Error) => toastError("Failed", friendlyError(e)),
                  })
                } M={M} />
                <SmallButton label="Edit" onPress={() => startEdit(p)} M={M} />
                <SmallButton label="Delete" tone="danger" onPress={() =>
                  remove.mutate(p.id, {
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

function LabeledInput({ label, hint, value, onChange }: Readonly<{ label: string; hint?: string; value: string; onChange: (v: string) => void }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={hint}
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

function GhostButton({ label, onPress, M }: Readonly<{ label: string; onPress: () => void; M: M }>) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: M.bg, borderWidth: 1, borderColor: M.border }} className="active:opacity-70">
      <Text style={{ fontWeight: "700", color: M.sub, fontSize: 14 }}>{label}</Text>
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
