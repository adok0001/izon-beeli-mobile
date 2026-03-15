import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUseFreeze } from "@/lib/hooks/use-progress";

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
            Streak Broken
          </Text>
          <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
            You missed a day and lost your {streak}-day streak.
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
                      Use a Streak Freeze
                    </Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">
                      Restore your streak — you have {freezeCount} freeze{freezeCount !== 1 ? "s" : ""}
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
                    Restore Streak
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={onDismiss} className="mt-3 items-center py-2">
                <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                  Start fresh instead
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Complete lessons to earn Streak Freezes and protect future streaks.
              </Text>
              <Pressable
                onPress={onDismiss}
                className="mt-5 items-center rounded-2xl bg-blue-500 py-4 active:opacity-80"
              >
                <Text className="text-base font-bold text-white">Start Fresh</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
