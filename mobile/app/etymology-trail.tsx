import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { getAllEtymology, getEtymologyForLanguage } from "@/lib/data/etymology";
import type { EtymologyEntry } from "@/lib/data/etymology";
import { hapticTap } from "@/lib/haptics";
import { useSaveWord } from "@/lib/hooks/use-wordbank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
        backgroundColor: active ? M.accent : M.card,
        borderWidth: 1, borderColor: active ? M.accent : M.border,
        marginRight: 8,
      }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.ink : M.text }}>{label}</Text>
    </Pressable>
  );
}

function TrailNode({
  node,
  expanded,
  onToggle,
  isLast,
  color,
}: {
  node: { era: string; form: string; language: string; note: string };
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
  color: string;
}) {
  const M = useMuseumTheme();

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Timeline spine */}
      <View style={{ width: 32, alignItems: "center" }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color, borderWidth: 2, borderColor: M.bg, marginTop: 14 }} />
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: `${color}40`, marginTop: 2 }} />}
      </View>

      {/* Card */}
      <Pressable
        onPress={onToggle}
        style={{ flex: 1, marginBottom: 14 }}
        className="active:opacity-70"
      >
        <View style={{ borderRadius: 14, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, overflow: "hidden" }}>
          <View style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, color, marginBottom: 3 }}>
                {node.era.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "900", color: M.text }}>{node.form}</Text>
              <Text style={{ fontSize: 12, color: M.muted, marginTop: 2 }}>{node.language}</Text>
            </View>
            <IconSymbol
              name={expanded ? "chevron.up" : "chevron.down"}
              size={14}
              color={M.muted}
            />
          </View>
          {expanded && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: M.border, paddingTop: 12 }}>
              <Text style={{ fontSize: 13, color: M.sub, lineHeight: 19 }}>{node.note}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function EntryView({ entry }: { entry: EtymologyEntry }) {
  const M = useMuseumTheme();
  const { mutate: saveWord } = useSaveWord();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));
  const [saved, setSaved] = useState(false);

  const colors = [getAccent("sky").solid, getAccent("purple").solid, M.accent, getAccent("teal").solid];

  const toggleNode = useCallback((i: number) => {
    hapticTap();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    hapticTap();
    setSaved(true);
  }, [saveWord, entry]);

  return (
    <View style={{ marginBottom: 32 }}>
      {/* Entry header */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: "900", color: M.text }}>{entry.word}</Text>
          <Text style={{ fontSize: 14, color: M.sub, marginTop: 2 }}>{entry.english}</Text>
        </View>
        <Pressable
          onPress={handleSave}
          style={{ borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: saved ? `${M.accent}20` : M.card, borderWidth: 1, borderColor: saved ? M.accent : M.border, flexDirection: "row", alignItems: "center", gap: 6 }}
          className="active:opacity-70"
        >
          <IconSymbol name={saved ? "bookmark.fill" : "bookmark"} size={14} color={saved ? M.accent : M.muted} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: saved ? M.accent : M.muted }}>{saved ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>

      {/* Trail */}
      {entry.trail.map((node, i) => (
        <TrailNode
          key={i}
          node={node}
          expanded={expandedNodes.has(i)}
          onToggle={() => toggleNode(i)}
          isLast={i === entry.trail.length - 1}
          color={colors[i % colors.length]!}
        />
      ))}
    </View>
  );
}

// Per-route error boundary — shows a recoverable message if this screen throws.
export { ErrorBoundary } from "@/components/screen-error-boundary";

export default function EtymologyTrailScreen() {
  const M = useMuseumTheme();
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);

  const allLanguages = ["all", ...new Set(getAllEtymology().map((e) => e.languageId))];
  const [filter, setFilter] = useState(selectedLanguageId);

  const entries = filter === "all"
    ? getAllEtymology()
    : getEtymologyForLanguage(filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top"]}>
      <Stack.Screen options={{ title: "Etymology Trail", headerBackTitle: "Back" }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: M.ink }}>
        <Text style={{ fontSize: 26, fontWeight: "900", color: M.parchment, letterSpacing: -0.3 }}>Etymology Trail</Text>
        <Text style={{ fontSize: 13, color: M.textDim, marginTop: 4 }}>Trace how words evolved across time</Text>
      </View>

      {/* Language filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 0 }}
        style={{ backgroundColor: M.ink, borderBottomWidth: 1, borderBottomColor: M.border, maxHeight: 56 }}
      >
        <CategoryPill label="All" active={filter === "all"} onPress={() => setFilter("all")} />
        {allLanguages.filter((l) => l !== "all").map((lang) => (
          <CategoryPill
            key={lang}
            label={lang.charAt(0).toUpperCase() + lang.slice(1)}
            active={filter === lang}
            onPress={() => setFilter(lang)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <IconSymbol name="clock.arrow.circlepath" size={44} color={M.muted} />
            <Text style={{ marginTop: 16, fontSize: 15, color: M.sub, textAlign: "center" }}>
              No etymology entries for this language yet.
            </Text>
          </View>
        ) : (
          entries.map((entry) => <EntryView key={entry.id} entry={entry} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
