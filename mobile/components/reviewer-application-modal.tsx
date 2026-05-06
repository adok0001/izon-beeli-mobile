import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

type ReviewerRole = "teacher" | "professor" | "elder";

const ROLE_OPTIONS: { value: ReviewerRole; labelKey: string }[] = [
  { value: "teacher", labelKey: "reviewerApplication.roleTeacher" },
  { value: "professor", labelKey: "reviewerApplication.roleProfessor" },
  { value: "elder", labelKey: "reviewerApplication.roleElder" },
];

interface ReviewerApplicationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReviewerApplicationModal({ visible, onClose }: ReviewerApplicationModalProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [role, setRole] = useState<ReviewerRole>("teacher");
  const [background, setBackground] = useState("");
  const [reason, setReason] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setRole("teacher");
    setBackground("");
    setReason("");
    setLanguagesInput("");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!background.trim() || !reason.trim()) {
      Alert.alert(
        t("reviewerApplication.requiredTitle"),
        t("reviewerApplication.requiredMessage")
      );
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const languages = languagesInput
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean);
      await apiFetch("/reviewer-applications", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ role, background: background.trim(), reason: reason.trim(), languages }),
      });
      Alert.alert(
        t("reviewerApplication.successTitle"),
        t("reviewerApplication.successMessage"),
        [{ text: t("common.done"), onPress: handleClose }]
      );
    } catch (err: any) {
      const msg = err?.message?.includes("pending")
        ? t("reviewerApplication.alreadyPending")
        : t("reviewerApplication.failedMessage");
      Alert.alert(t("reviewerApplication.failedTitle"), msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ScrollView
        className="flex-1 bg-white dark:bg-neutral-900"
        contentContainerClassName="px-5 pt-6 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {t("reviewerApplication.title")}
          </Text>
          <Pressable onPress={handleClose} className="p-1 active:opacity-60">
            <Text className="text-base text-blue-500">{t("common.cancel")}</Text>
          </Pressable>
        </View>

        <Text className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          {t("reviewerApplication.subtitle")}
        </Text>

        {/* Role chips */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("reviewerApplication.roleLabel")}
        </Text>
        <View className="mb-6 flex-row gap-2">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRole(option.value)}
                className={`rounded-full px-4 py-2 active:opacity-70 ${
                  active
                    ? "bg-emerald-500"
                    : "border border-neutral-300 dark:border-neutral-600"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-white" : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {t(option.labelKey as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Background */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("reviewerApplication.backgroundLabel")}
        </Text>
        <TextInput
          className="mb-1 min-h-[100px] rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder={t("reviewerApplication.backgroundPlaceholder")}
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          maxLength={1000}
          value={background}
          onChangeText={setBackground}
        />
        <Text className="mb-5 text-right text-xs text-neutral-400">
          {background.length}/1000
        </Text>

        {/* Reason */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("reviewerApplication.reasonLabel")}
        </Text>
        <TextInput
          className="mb-1 min-h-[100px] rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder={t("reviewerApplication.reasonPlaceholder")}
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          maxLength={1000}
          value={reason}
          onChangeText={setReason}
        />
        <Text className="mb-6 text-right text-xs text-neutral-400">
          {reason.length}/1000
        </Text>

        {/* Languages */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("reviewerApplication.languagesLabel")}
        </Text>
        <TextInput
          className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder={t("reviewerApplication.languagesPlaceholder")}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={languagesInput}
          onChangeText={setLanguagesInput}
        />

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="items-center rounded-xl bg-emerald-500 py-3.5 active:opacity-80"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {t("reviewerApplication.submit")}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </Modal>
  );
}
