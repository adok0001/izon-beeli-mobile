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
import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "@/lib/api";
import type { FeedbackCategory } from "@/types";

const platform = Platform.OS;
const osVersion = String(Platform.Version);
const appVersion = Constants.expoConfig?.version ?? "unknown";

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { getToken } = useAuth();
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
      `mailto:support@izonbeeli.com?subject=${subject}&body=${body}`
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert("Required", "Please describe the issue or idea.");
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
      Alert.alert("Thank you!", "Your feedback was sent.", [
        { text: "OK", onPress: handleClose },
      ]);
    } catch {
      Alert.alert(
        "Submission failed",
        "We couldn't send your feedback right now.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Send via email instead", onPress: openEmailFallback },
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
            Send Feedback
          </Text>
          <Pressable onPress={handleClose} className="p-1 active:opacity-60">
            <Text className="text-base text-blue-500">Cancel</Text>
          </Pressable>
        </View>

        {/* Category chips */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          CATEGORY
        </Text>
        <View className="mb-5 flex-row gap-2">
          {CATEGORIES.map((c) => {
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
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Message input */}
        <Text className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          DESCRIPTION
        </Text>
        <TextInput
          className="min-h-[120px] rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="Describe the issue or idea…"
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
            <Text className="text-base font-semibold text-white">Submit</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}
