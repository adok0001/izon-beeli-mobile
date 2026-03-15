import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useThemeStore } from "@/store/theme-store";

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemScheme = useRNColorScheme();
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) return "light";

  if (preference === "system") return systemScheme;
  return preference;
}
