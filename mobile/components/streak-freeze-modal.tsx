import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUseFreeze } from "@/lib/hooks/use-progress";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface StreakFreezeModalProps {
  visible: boolean;
  streak: number;
  freezeCount: number;
  onDismiss: () => void;
}

export function StreakFreezeModal({
  visible,
  streak,
  freezeCount,
  onDismiss,
}: StreakFreezeModalProps) {
  const { t } = useTranslation();
  const useFreeze = useUseFreeze();

  const handleUseFreeze = async () => {
    useFreeze.mutate(undefined, { onSuccess: onDismiss });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
          {/* Icon */}
          <View className="mb-4 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <IconSymbol name="flame.fill" size={40} color="#f59e0b" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-center text-2xl font-bold text-neutral-900 dark:text-white">
            {t("streak.brokenTitle")}
          </Text>
          <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t("streak.brokenMessage", { streak })}
          </Text>

          {/* Freeze option */}
          {freezeCount > 0 ? (
            <>
              <View className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                    <IconSymbol name="snowflake" size={20} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {t("streak.useFreezeTitle")}
                    </Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">
                      {t("streak.useFreezeDescription", { count: freezeCount })}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={handleUseFreeze}
                disabled={useFreeze.isPending}
                className="mt-4 items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
              >
                {useFreeze.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    {t("streak.restoreButton")}
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={onDismiss} className="mt-3 items-center py-2">
                <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                  {t("streak.startFreshLink")}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t("streak.noFreezesMessage")}
              </Text>
              <Pressable
                onPress={onDismiss}
                className="mt-5 items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
              >
                <Text className="text-base font-bold text-white">{t("streak.startFreshButton")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
