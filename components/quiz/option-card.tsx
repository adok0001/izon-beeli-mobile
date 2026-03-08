import { Pressable, Text } from "react-native";

export type OptionState = "default" | "correct" | "incorrect" | "dimmed";

export function OptionCard({
  label,
  state,
  onPress,
}: {
  label: string;
  state: OptionState;
  onPress: () => void;
}) {
  const bgClass = {
    default:
      "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
    correct: "bg-green-50 dark:bg-green-900/40 border-green-500",
    incorrect: "bg-red-50 dark:bg-red-900/40 border-red-500",
    dimmed:
      "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50",
  }[state];

  const textClass = {
    default: "text-neutral-900 dark:text-white",
    correct: "text-green-700 dark:text-green-300",
    incorrect: "text-red-700 dark:text-red-300",
    dimmed: "text-neutral-400 dark:text-neutral-500",
  }[state];

  return (
    <Pressable
      onPress={onPress}
      disabled={state !== "default"}
      className={`mb-3 rounded-xl border-2 px-5 py-4 ${bgClass}`}
    >
      <Text className={`text-base font-medium ${textClass}`}>{label}</Text>
    </Pressable>
  );
}
