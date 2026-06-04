import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { AdinkraSymbol } from "@/lib/data/adinkra";
import { AdinkraSymbolView } from "./adinkra-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";

interface Props {
  symbol: AdinkraSymbol;
  onPress?: () => void;
}

export function SymbolCard({ symbol, onPress }: Props) {
  const M = useMuseumTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/adinkra");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flex: 1, alignItems: "center", borderRadius: 16, backgroundColor: M.card, padding: 12, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <View style={{ marginBottom: 8, height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: M.bg }}>
        <AdinkraSymbolView symbol={symbol} size={40} color="#6366f1" />
      </View>
      <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "700", color: M.text }} numberOfLines={1}>
        {symbol.name}
      </Text>
      <Text style={{ marginTop: 2, textAlign: "center", fontSize: 10, color: M.sub }} numberOfLines={1}>
        {symbol.meaning}
      </Text>
    </Pressable>
  );
}
