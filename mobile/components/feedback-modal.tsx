import { apiFetch } from "@/lib/api";
import type { FeedbackCategory } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const platform = Platform.OS;
const osVersion = String(Platform.Version);
const appVersion = Constants.expoConfig?.version ?? "unknown";

const CATEGORY_KEYS: { value: FeedbackCategory; labelKey: string }[] = [
  { value: "bug", labelKey: "feedback.categoryBug" },
  { value: "suggestion", labelKey: "feedback.categorySuggestion" },
  { value: "other", labelKey: "feedback.categoryOther" },
];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setCategory("bug");
    setMessage("");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function openEmailFallback() {
    const subject = encodeURIComponent(`[${category}] App Feedback`);
    const body = encodeURIComponent(
      `Category: ${category}\n\n${message}\n\n---\nPlatform: ${platform}\nOS: ${osVersion}\nApp: ${appVersion}`
    );
    await Linking.openURL(
      `mailto:support@izon-beeli.com?subject=${subject}&body=${body}`
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert(t("feedback.requiredTitle"), t("feedback.requiredMessage"));
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      await apiFetch("/feedback", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ category, message, platform, osVersion, appVersion }),
      });
      Alert.alert(t("feedback.successTitle"), t("feedback.successMessage"), [
        { text: t("common.done"), onPress: handleClose },
      ]);
    } catch {
      Alert.alert(
        t("feedback.failedTitle"),
        t("feedback.failedMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("feedback.emailFallback"), onPress: openEmailFallback },
        ]
      );
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
      <View className="flex-1 bg-white px-5 pt-6 dark:bg-neutral-900">
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {t("feedback.title")}
          </Text>
          <Pressable onPress={handleClose} className="p-1 active:opacity-60">
            <Text className="text-base text-blue-500">{t("common.cancel")}</Text>
          </Pressable>
        </View>

        {/* Category chips */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("feedback.categoryLabel")}
        </Text>
        <View className="mb-5 flex-row gap-2">
          {CATEGORY_KEYS.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`rounded-full px-4 py-2 active:opacity-70 ${
                  active
                    ? "bg-blue-500"
                    : "border border-neutral-300 dark:border-neutral-600"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active
                      ? "text-white"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {t(c.labelKey as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Message input */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {t("feedback.descriptionLabel")}
        </Text>
        <TextInput
          className="min-h-[120px] rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder={t("feedback.descriptionPlaceholder")}
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={2000}
          value={message}
          onChangeText={setMessage}
        />
        <Text className="mt-1 text-right text-xs text-neutral-400">
          {message.length}/2000
        </Text>

        {/* Device info */}
        <Text className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
          {`Platform: ${platform}  •  OS: ${osVersion}  •  App: ${appVersion}`}
        </Text>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="mt-6 items-center rounded-xl bg-blue-500 py-3.5 active:opacity-80"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">{t("feedback.submit")}</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}
