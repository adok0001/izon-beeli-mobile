import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ADINKRA_SYMBOLS } from "@/lib/data/adinkra";
import { getDailyItem } from "@/lib/daily-picker";
import { AdinkraSymbolView } from "./adinkra-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";

export function SymbolOfTheDay() {
  const M = useMuseumTheme();
  const router = useRouter();
  const symbol = getDailyItem(ADINKRA_SYMBOLS);

  if (!symbol) return null;

  return (
    <Pressable
      onPress={() => router.push("/adinkra")}
      style={{ borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <IconSymbol name="sparkles" size={16} color="#6366f1" />
        <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: "#6366f1" }}>
          Adinkra Symbol of the Day
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ marginRight: 12, height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: M.bg }}>
          <AdinkraSymbolView symbol={symbol} size={36} color="#6366f1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>{symbol.name}</Text>
          <Text style={{ fontSize: 13, color: M.sub }}>{symbol.meaning}</Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={M.muted} />
      </View>
    </Pressable>
  );
}
