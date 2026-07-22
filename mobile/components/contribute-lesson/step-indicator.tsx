import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useStepMeta } from "./use-step-meta";
import { STEPS } from "./types";

type StepIndicatorProps = Readonly<{
  currentIndex: number;
}>;

export function StepIndicator({ currentIndex }: StepIndicatorProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const STEP_META = useStepMeta(t);

  return (
    <View className="border-b border-neutral-100 px-5 pb-3 pt-2 dark:border-neutral-800">
      <View className="flex-row items-center justify-between">
        {STEPS.map((s, i) => {
          const meta = STEP_META[s];
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <View key={s} className="items-center" style={{ flex: 1 }}>
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isActive
                    ? "bg-blue-500"
                    : isDone
                      ? "bg-green-500"
                      : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              >
                {isDone ? (
                  <IconSymbol name="checkmark" size={14} color="white" />
                ) : (
                  <IconSymbol
                    name={meta.icon}
                    size={14}
                    color={isActive ? M.parchment : M.muted}
                  />
                )}
              </View>
              <Text
                className={`mt-1 text-[10px] ${
                  isActive
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : isDone
                      ? "text-green-600 dark:text-green-400"
                      : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {meta.label}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Connecting line */}
      <View className="absolute left-[10%] right-[10%] top-[18px] z-[-1] h-[2px] bg-neutral-200 dark:bg-neutral-700" />
    </View>
  );
}
