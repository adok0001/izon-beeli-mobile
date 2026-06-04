import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AdinkraSymbolView } from "@/components/adinkra/adinkra-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { ADINKRA_SYMBOLS, type AdinkraSymbol } from "@/lib/data/adinkra";

const CATEGORIES = [
  "all",
  "spirituality",
  "wisdom",
  "perseverance",
  "unity",
  "leadership",
  "love",
] as const;

type Category = (typeof CATEGORIES)[number];

const INDIGO = "#6366f1";

function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ marginRight: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: active ? INDIGO : M.card, borderWidth: 1, borderColor: active ? INDIGO : M.border }}
    >
      <Text style={{ fontSize: 13, fontWeight: "500", textTransform: "capitalize", color: active ? "#fff" : M.sub }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SymbolGridItem({ symbol, onPress }: { symbol: AdinkraSymbol; onPress: () => void }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}
      className="active:opacity-70"
    >
      <View style={{ marginBottom: 8, height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: `${INDIGO}15`, borderWidth: 1, borderColor: `${INDIGO}30` }}>
        <AdinkraSymbolView symbol={symbol} size={44} color={INDIGO} />
      </View>
      <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "700", color: M.text }} numberOfLines={1}>
        {symbol.name}
      </Text>
      <Text style={{ marginTop: 2, textAlign: "center", fontSize: 11, color: M.sub }} numberOfLines={1}>
        {symbol.meaning}
      </Text>
    </Pressable>
  );
}

function SymbolDetail({ symbol, onClose }: { symbol: AdinkraSymbol; onClose: () => void }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: M.card, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, borderWidth: 1, borderColor: M.border }}>
        <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>Symbol Detail</Text>
          <Pressable onPress={onClose} style={{ height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: M.border }}>
            <IconSymbol name="xmark" size={16} color={M.sub} />
          </Pressable>
        </View>

        <View style={{ marginBottom: 16, alignItems: "center" }}>
          <View style={{ marginBottom: 12, height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: `${INDIGO}15`, borderWidth: 1, borderColor: `${INDIGO}30` }}>
            <AdinkraSymbolView symbol={symbol} size={64} color={INDIGO} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: M.text }}>{symbol.name}</Text>
          {symbol.akanName !== symbol.name && (
            <Text style={{ marginTop: 2, fontSize: 13, fontStyle: "italic", color: M.sub }}>{symbol.akanName}</Text>
          )}
        </View>

        <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: M.bg, padding: 12, borderWidth: 1, borderColor: M.border }}>
          <Text style={{ marginBottom: 4, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: INDIGO }}>Meaning</Text>
          <Text style={{ fontSize: 13, color: M.sub }}>{symbol.meaning}</Text>
        </View>

        <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: M.bg, padding: 12, borderWidth: 1, borderColor: M.border }}>
          <Text style={{ marginBottom: 4, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: INDIGO }}>Category</Text>
          <Text style={{ fontSize: 13, textTransform: "capitalize", color: M.sub }}>{symbol.category}</Text>
        </View>

        <View style={{ borderRadius: 12, backgroundColor: `${INDIGO}10`, padding: 12, borderWidth: 1, borderColor: `${INDIGO}30` }}>
          <Text style={{ marginBottom: 4, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: INDIGO }}>Proverb</Text>
          <Text style={{ fontSize: 13, fontStyle: "italic", lineHeight: 20, color: M.sub }}>&ldquo;{symbol.proverb}&rdquo;</Text>
        </View>
      </View>
    </View>
  );
}

export default function AdinkraScreen() {
  const M = useMuseumTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<AdinkraSymbol | null>(
    null
  );

  const filteredSymbols =
    selectedCategory === "all"
      ? ADINKRA_SYMBOLS
      : ADINKRA_SYMBOLS.filter((s) => s.category === selectedCategory);

  const renderItem = useCallback(
    ({ item, index }: { item: AdinkraSymbol; index: number }) => {
      // Add spacer for odd items in 2-column grid
      const isLastOdd =
        index === filteredSymbols.length - 1 && index % 2 === 0;
      return (
        <View className="flex-row gap-3">
          <SymbolGridItem
            symbol={item}
            onPress={() => setSelectedSymbol(item)}
          />
          {isLastOdd && <View className="flex-1" />}
        </View>
      );
    },
    [filteredSymbols.length]
  );

  // Pair symbols into rows of 2 for the grid
  const pairedData: AdinkraSymbol[][] = [];
  for (let i = 0; i < filteredSymbols.length; i += 2) {
    pairedData.push(filteredSymbols.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Adinkra Symbols" }} />

      <View style={{ borderBottomWidth: 1, borderBottomColor: M.border, paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={pairedData}
        keyExtractor={(_, index) => `row-${index}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row }) => (
          <View style={{ marginBottom: 12, flexDirection: "row", gap: 12 }}>
            {row.map((symbol) => (
              <SymbolGridItem
                key={symbol.id}
                symbol={symbol}
                onPress={() => setSelectedSymbol(symbol)}
              />
            ))}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        )}
      />

      <Modal
        visible={selectedSymbol !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSymbol(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          {selectedSymbol && (
            <SymbolDetail
              symbol={selectedSymbol}
              onClose={() => setSelectedSymbol(null)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
