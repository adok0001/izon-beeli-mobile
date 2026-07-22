import { Pressable, Text, View } from "react-native";

export function TabPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center rounded-full px-4 py-2 ${
        active ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-neutral-600 dark:text-neutral-400"
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          className={`ml-1.5 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
            active ? "bg-white/25" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              active ? "text-white" : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
