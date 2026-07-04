import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import type { AdinkraSymbol } from "@/types/scripts";
import { AdinkraSymbolView } from "./adinkra-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ShareModal } from "@/components/share/share-modal";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";

interface Props {
  symbol: AdinkraSymbol;
  onPress?: () => void;
}

export function SymbolCard({ symbol, onPress }: Props) {
  const M = useMuseumTheme();
  const router = useRouter();
  const [shareVisible, setShareVisible] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/adinkra");
    }
  };

  return (
    <>
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

        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          style={{ position: "absolute", top: 6, right: 8 }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel="Share symbol"
        >
          <IconSymbol name="square.and.arrow.up" size={13} color={M.muted} />
        </TouchableOpacity>
      </Pressable>

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        data={{
          template: "symbol",
          name: symbol.name,
          meaning: symbol.meaning,
          language: "Akan / Adinkra",
        }}
      />
    </>
  );
}
