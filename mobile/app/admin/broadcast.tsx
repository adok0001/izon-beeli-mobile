import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { apiFetch } from "@/lib/api";
import { useLanguages } from "@/lib/hooks/use-languages";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getAccent } from "@/constants/accent-colors";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BROADCAST_ICONS: { name: string; label: string }[] = [
  { name: "bell.fill", label: "General" },
  { name: "star.fill", label: "Featured" },
  { name: "megaphone", label: "Announce" },
  { name: "flame.fill", label: "Hot" },
  { name: "heart.fill", label: "Community" },
  { name: "trophy.fill", label: "Achievement" },
  { name: "calendar", label: "Event" },
  { name: "checkmark.circle.fill", label: "Done" },
];

export default function BroadcastScreen() {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const { data: languages = [] } = useLanguages();

  type Audience = "all" | "admins" | "educators";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bell.fill");
  const [audience, setAudience] = useState<Audience>("all");
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const ROLE_OPTIONS: { value: Audience; label: string }[] = [
    { value: "all", label: t("admin.notifications.roleAll") },
    { value: "admins", label: t("admin.notifications.roleAdmins") },
    { value: "educators", label: t("admin.notifications.roleEducators") },
  ];

  const selectedLanguageName = languageId
    ? languages.find((l) => l.id === languageId)?.name ?? languageId
    : t("admin.notifications.allUsers");

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      const result = await apiFetch<{ sent: number; total: number }>("/notifications/broadcast", {
        token: token ?? undefined,
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          data: { icon: selectedIcon },
          ...(audience !== "all" ? { audience } : {}),
          ...(languageId ? { languageId } : {}),
        }),
      });
      Alert.alert(
        t("admin.notifications.sent"),
        t("admin.notifications.success", { sent: result.sent, total: result.total })
      );
      setTitle("");
      setBody("");
      setSelectedIcon("bell.fill");
      setAudience("all");
      setLanguageId(null);
    } catch {
      Alert.alert(t("common.error"), t("admin.notifications.error"));
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const inputStyle = { backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText };
  const blue = getAccent("blue").solid;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: M.ink }} edges={["top"]}>
      <StudioScreenHeader title={t("admin.notifications.title")} subtitle={t("admin.notifications.subtitle")} />
      <ScrollView
        style={{ backgroundColor: M.bg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Audience role */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
          {t("admin.notifications.audience")}
        </Text>
        <View className="mb-3">
          <StudioFilterPills
            options={ROLE_OPTIONS.map(({ value, label }) => ({ id: value, label }))}
            value={audience}
            onChange={setAudience}
          />
        </View>

        {/* Language filter */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setPickerVisible(true)}
            className="flex-1 flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-70"
            style={{ backgroundColor: M.card, borderColor: M.border }}
          >
            <Text className="text-sm font-semibold" style={{ color: M.text }}>
              {selectedLanguageName}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={M.muted} />
          </Pressable>
          {languageId && (
            <Pressable
              onPress={() => setLanguageId(null)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-70"
              style={{ backgroundColor: M.card }}
            >
              <IconSymbol name="xmark" size={16} color={M.muted} />
            </Pressable>
          )}
        </View>
        <Text className="mt-1.5 text-xs mb-5" style={{ color: M.muted }}>
          {audience === "admins"
            ? t("admin.notifications.audienceAdmins", "Only admins will receive this.")
            : audience === "educators"
            ? t("admin.notifications.audienceEducators", "Only educators (reviewers) will receive this.")
            : languageId
            ? t("admin.notifications.audienceFiltered", { language: selectedLanguageName, defaultValue: "Only {{language}} learners will receive this." })
            : t("admin.notifications.audienceAll", "No language selected — all users will receive this.")}
        </Text>

        {/* Title */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
          {t("admin.notifications.notifTitle")}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("admin.notifications.titlePlaceholder")}
          placeholderTextColor={M.muted}
          maxLength={100}
          style={inputStyle}
          className="rounded-2xl border px-4 py-3 text-sm mb-5"
        />

        {/* Body */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: M.muted }}>
          {t("admin.notifications.message")}
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t("admin.notifications.messagePlaceholder")}
          placeholderTextColor={M.muted}
          maxLength={250}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={inputStyle}
          className="rounded-2xl border px-4 py-3 text-sm mb-1 min-h-[80px]"
        />
        <Text className="text-xs text-right mb-6" style={{ color: M.muted }}>{body.length}/250</Text>

        {/* Icon */}
        <Text className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: M.muted }}>
          Icon
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {BROADCAST_ICONS.map(({ name, label }) => {
            const active = selectedIcon === name;
            return (
              <Pressable
                key={name}
                onPress={() => setSelectedIcon(name)}
                className="items-center gap-1.5 rounded-2xl px-3 py-2.5 border active:opacity-70"
                style={active
                  ? { backgroundColor: M.infoBg, borderColor: M.infoBorder }
                  : { backgroundColor: M.card, borderColor: M.border }}
              >
                <IconSymbol
                  name={name as any}
                  size={20}
                  color={active ? blue : M.muted}
                />
                <Text className="text-[10px] font-medium" style={{ color: active ? blue : M.muted }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        {(title.trim() || body.trim()) ? (
          <StudioCard style={{ marginBottom: 24 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name={selectedIcon as any} size={14} color={M.muted} />
              <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: M.muted }}>
                {t("admin.notifications.preview")}
              </Text>
            </View>
            <Text className="text-sm font-bold" style={{ color: M.text }}>{title || t("admin.notifications.notifTitle")}</Text>
            <Text className="text-sm mt-0.5" style={{ color: M.sub }}>{body || t("admin.notifications.message")}</Text>
          </StudioCard>
        ) : null}

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${canSend ? "active:opacity-80" : ""}`}
          style={{ backgroundColor: canSend ? M.accent : M.border }}
        >
          {sending ? (
            <ActivityIndicator size="small" color={M.parchment} />
          ) : (
            <IconSymbol name="paperplane.fill" size={16} color={canSend ? M.parchment : M.muted} />
          )}
          <Text className="text-base font-bold" style={{ color: canSend ? M.parchment : M.muted }}>
            {sending ? t("admin.notifications.sending") : t("admin.notifications.send")}
          </Text>
        </Pressable>
      </ScrollView>

      <LanguagePickerModal
        visible={pickerVisible}
        selectedId={languageId ?? ""}
        onSelect={(id) => { setLanguageId(id); setPickerVisible(false); }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}
