import { apiFetch } from "@/lib/api";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RestoreAccountScreen() {
  const { restoreBy } = useLocalSearchParams<{ restoreBy: string }>();
  const router = useRouter();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { toast, error: toastError, dismiss: dismissToast } = useToast();

  const formattedDate = restoreBy
    ? new Date(restoreBy).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handleRestore = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await apiFetch("/users/me/restore", {
        method: "POST",
        token: token ?? undefined,
      });
      router.replace("/(tabs)/learn");
    } catch {
      toastError(t("common.error"), t("restoreAccount.restoreError"));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueDeletion = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-900">
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
        <Text className="text-3xl">⚠️</Text>
      </View>

      <Text className="mb-3 text-center text-2xl font-bold text-neutral-900 dark:text-white">
        {t("restoreAccount.title")}
      </Text>

      <Text className="mb-2 text-center text-base text-neutral-600 dark:text-neutral-400">
        {t("restoreAccount.body")}
      </Text>

      {formattedDate ? (
        <Text className="mb-8 text-center text-sm font-semibold text-orange-600 dark:text-orange-400">
          {t("restoreAccount.deadline", { date: formattedDate })}
        </Text>
      ) : null}

      <Pressable
        onPress={handleRestore}
        disabled={loading}
        className="mb-3 w-full items-center rounded-xl bg-blue-600 py-3.5 active:opacity-80 disabled:opacity-50"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="font-semibold text-white">
            {t("restoreAccount.restoreButton")}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={handleContinueDeletion} disabled={loading} className="py-2">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("restoreAccount.continueDeletion")}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
