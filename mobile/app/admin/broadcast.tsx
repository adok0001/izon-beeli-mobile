import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerModal } from "@/components/language-picker";
import { apiFetch } from "@/lib/api";
import { useLanguages } from "@/lib/hooks/use-languages";
import { useAuth } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
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
  const { getToken } = useAuth();
  const { data: languages = [] } = useLanguages();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bell.fill");
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [sending, setSending] = useState(false);

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
        body: JSON.stringify({ title, body, data: { icon: selectedIcon }, ...(languageId ? { languageId } : {}) }),
      });
      Alert.alert(
        t("admin.notifications.sent"),
        t("admin.notifications.success", { sent: result.sent, total: result.total })
      );
      setTitle("");
      setBody("");
      setSelectedIcon("bell.fill");
      setLanguageId(null);
    } catch {
      Alert.alert(t("common.error"), t("admin.notifications.error"));
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <>
      <Stack.Screen options={{ title: t("admin.notifications.title") }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {t("admin.notifications.title")}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {t("admin.notifications.subtitle")}
          </Text>

          {/* Audience picker */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
            {t("admin.notifications.audience")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="flex-1 flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                {selectedLanguageName}
              </Text>
              <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
            </Pressable>
            {languageId && (
              <Pressable
                onPress={() => setLanguageId(null)}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 active:opacity-70"
              >
                <IconSymbol name="xmark" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>
          <Text className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 mb-5">
            {languageId
              ? t("admin.notifications.audienceFiltered", { language: selectedLanguageName, defaultValue: "Only {{language}} learners will receive this." })
              : t("admin.notifications.audienceAll", "No language selected — all users will receive this.")}
          </Text>

          {/* Title */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
            {t("admin.notifications.notifTitle")}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("admin.notifications.titlePlaceholder")}
            placeholderTextColor="#9ca3af"
            maxLength={100}
            className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white mb-5"
          />

          {/* Body */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
            {t("admin.notifications.message")}
          </Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t("admin.notifications.messagePlaceholder")}
            placeholderTextColor="#9ca3af"
            maxLength={250}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-white mb-1 min-h-[80px]"
          />
          <Text className="text-xs text-neutral-400 text-right mb-6">{body.length}/250</Text>

          {/* Icon */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
            Icon
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {BROADCAST_ICONS.map(({ name, label }) => {
              const active = selectedIcon === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelectedIcon(name)}
                  className={`items-center gap-1.5 rounded-2xl px-3 py-2.5 border ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500"
                      : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                  } active:opacity-70`}
                >
                  <IconSymbol
                    name={name as any}
                    size={20}
                    color={active ? "#2563eb" : "#9ca3af"}
                  />
                  <Text className={`text-[10px] font-medium ${active ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Preview */}
          {(title.trim() || body.trim()) ? (
            <View className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 py-4 mb-6">
              <View className="flex-row items-center gap-2 mb-2">
                <IconSymbol name={selectedIcon as any} size={14} color="#9ca3af" />
                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  {t("admin.notifications.preview")}
                </Text>
              </View>
              <Text className="text-sm font-bold text-neutral-900 dark:text-white">{title || t("admin.notifications.notifTitle")}</Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{body || t("admin.notifications.message")}</Text>
            </View>
          ) : null}

          {/* Send button */}
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${canSend ? "bg-brand-600 active:opacity-80" : "bg-neutral-200 dark:bg-neutral-700"}`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="paperplane.fill" size={16} color={canSend ? "#fff" : "#9ca3af"} />
            )}
            <Text className={`text-base font-bold ${canSend ? "text-white" : "text-neutral-400"}`}>
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
    </>
  );
}
