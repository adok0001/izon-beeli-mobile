import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { FeedbackCategory } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  const M = useMuseumTheme();
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
    try {
      await Linking.openURL(
        `mailto:support@izon-beeli.com?subject=${subject}&body=${body}`
      );
    } catch {
      Alert.alert(t("common.error"), t("feedback.emailUnavailable"));
    }
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 24 }}>
        <View style={{ marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: M.parchment }}>{t("feedback.title")}</Text>
          <Pressable onPress={handleClose} style={{ padding: 4 }} className="active:opacity-60">
            <Text style={{ fontSize: 16, color: M.accent }}>{t("common.cancel")}</Text>
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
            marginBottom: 20,
            backgroundColor: `${M.accent}12`,
            borderWidth: 1, borderColor: `${M.accent}28`,
          }}
        >
          <IconSymbol name="lock.fill" size={12} color={M.accent} />
          <Text style={{ flex: 1, fontSize: 12, color: M.textDim, lineHeight: 17 }}>
            {t("feedback.adminOnlyNotice")}
          </Text>
        </View>

        <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: "600", color: M.textDim }}>{t("feedback.categoryLabel")}</Text>
        <View style={{ marginBottom: 20, flexDirection: "row", gap: 8 }}>
          {CATEGORY_KEYS.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: active ? M.accent : "transparent", borderWidth: 1, borderColor: active ? M.accent : M.border }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: active ? M.ink : M.textDim }}>
                  {t(c.labelKey as any)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: "600", color: M.textDim }}>{t("feedback.descriptionLabel")}</Text>
        <TextInput
          style={{ minHeight: 120, borderRadius: 12, borderWidth: 1, borderColor: M.inputBorder, backgroundColor: M.inputBg, padding: 12, fontSize: 16, color: M.inputText, textAlignVertical: "top" }}
          placeholder={t("feedback.descriptionPlaceholder")}
          placeholderTextColor={M.inputPlaceholder}
          multiline
          numberOfLines={5}
          maxLength={2000}
          value={message}
          onChangeText={setMessage}
        />
        <Text style={{ marginTop: 4, textAlign: "right", fontSize: 11, color: M.muted }}>{message.length}/2000</Text>

        <Text style={{ marginTop: 16, fontSize: 11, color: M.textDimDark }}>
          {`Platform: ${platform}  •  OS: ${osVersion}  •  App: ${appVersion}`}
        </Text>

        <Pressable onPress={handleSubmit} disabled={loading} style={{ marginTop: 24, alignItems: "center", borderRadius: 12, backgroundColor: M.accent, paddingVertical: 14 }} className="active:opacity-80">
          {loading ? (
            <ActivityIndicator color={M.ink} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: M.ink }}>{t("feedback.submit")}</Text>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
