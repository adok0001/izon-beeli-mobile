import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";

interface Props {
  name: string;
  size?: "sm" | "md";
}

export function ContributorBadge({ name, size = "sm" }: Props) {
  const M = useMuseumTheme();
  if (size === "md") {
    return (
      <View className="flex-row items-center rounded-full bg-blue-50 px-3 py-1.5 dark:bg-blue-900/30">
        <IconSymbol name="person.fill" size={14} color={getAccent("blue").solid} />
        <Text className="ml-1.5 text-sm font-medium text-blue-700 dark:text-blue-300">
          {name}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
      <IconSymbol name="person.fill" size={10} color={M.muted} />
      <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
        {name}
      </Text>
    </View>
  );
}
