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

function CategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-1.5 ${
        active
          ? "bg-indigo-600 dark:bg-indigo-500"
          : "bg-neutral-100 dark:bg-neutral-800"
      }`}
    >
      <Text
        className={`text-sm font-medium capitalize ${
          active
            ? "text-white"
            : "text-neutral-600 dark:text-neutral-400"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SymbolGridItem({
  symbol,
  onPress,
}: {
  symbol: AdinkraSymbol;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-1 items-center rounded-2xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
    >
      <View className="mb-2 h-16 w-16 items-center justify-center rounded-xl bg-white dark:bg-neutral-700">
        <AdinkraSymbolView symbol={symbol} size={44} color="#6366f1" />
      </View>
      <Text
        className="text-center text-sm font-bold text-neutral-900 dark:text-white"
        numberOfLines={1}
      >
        {symbol.name}
      </Text>
      <Text
        className="mt-0.5 text-center text-xs text-neutral-500 dark:text-neutral-400"
        numberOfLines={1}
      >
        {symbol.meaning}
      </Text>
    </Pressable>
  );
}

function SymbolDetail({
  symbol,
  onClose,
}: {
  symbol: AdinkraSymbol;
  onClose: () => void;
}) {
  return (
    <View className="flex-1 justify-end">
      <Pressable className="flex-1" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-neutral-900">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            Symbol Detail
          </Text>
          <Pressable
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <IconSymbol name="xmark" size={16} color="#9ca3af" />
          </Pressable>
        </View>

        <View className="mb-4 items-center">
          <View className="mb-3 h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950">
            <AdinkraSymbolView symbol={symbol} size={64} color="#6366f1" />
          </View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            {symbol.name}
          </Text>
          {symbol.akanName !== symbol.name && (
            <Text className="mt-0.5 text-sm italic text-neutral-500 dark:text-neutral-400">
              {symbol.akanName}
            </Text>
          )}
        </View>

        <View className="mb-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Meaning
          </Text>
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">
            {symbol.meaning}
          </Text>
        </View>

        <View className="mb-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Category
          </Text>
          <Text className="text-sm capitalize text-neutral-700 dark:text-neutral-300">
            {symbol.category}
          </Text>
        </View>

        <View className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Proverb
          </Text>
          <Text className="text-sm italic leading-5 text-neutral-700 dark:text-neutral-300">
            &ldquo;{symbol.proverb}&rdquo;
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AdinkraScreen() {
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
    <SafeAreaView
      className="flex-1 bg-white dark:bg-neutral-900"
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: "Adinkra Symbols" }} />

      {/* Category filter */}
      <View className="border-b border-neutral-100 pb-3 pt-2 dark:border-neutral-800">
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

      {/* Symbol grid */}
      <FlatList
        data={pairedData}
        keyExtractor={(_, index) => `row-${index}`}
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row }) => (
          <View className="mb-3 flex-row gap-3">
            {row.map((symbol) => (
              <SymbolGridItem
                key={symbol.id}
                symbol={symbol}
                onPress={() => setSelectedSymbol(symbol)}
              />
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        )}
      />

      {/* Detail modal */}
      <Modal
        visible={selectedSymbol !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSymbol(null)}
      >
        <View className="flex-1 bg-black/50">
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
