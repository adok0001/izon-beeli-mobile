import { useColorScheme as useRNColorScheme } from "react-native";
import { useThemeStore } from "@/store/theme-store";

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const preference = useThemeStore((s) => s.preference);

  if (preference === "system") return systemScheme;
  return preference;
}
