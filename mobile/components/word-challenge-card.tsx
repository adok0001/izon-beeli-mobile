import { IconSymbol } from "@/components/ui/icon-symbol";
import { ShareModal } from "@/components/share/share-modal";
import { useWordOfTheDay } from "@/lib/hooks/use-word-of-the-day";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

interface Props {
  languageId: string;
}

export function WordChallengeCard({ languageId }: Props) {
  const M = useMuseumTheme();
  const router = useRouter();
  const word = useWordOfTheDay(languageId);
  const [shareVisible, setShareVisible] = useState(false);

  if (!word) return null;

  return (
    <>
    <Pressable
      onPress={() => router.push("/word-challenge" as any)}
      style={{
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 4,
        borderLeftColor: "#f43f5e",
        overflow: "hidden",
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Word Challenge: ${word.word}`}
    >
      {/* Header strip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(244, 63, 94, 0.08)",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(244, 63, 94, 0.15)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <IconSymbol name="pencil.and.scribble" size={12} color="#f43f5e" />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "#f43f5e" }}>
            WORD CHALLENGE
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "rgba(244, 63, 94, 0.15)" }}>
            <Text style={{ fontSize: 8, fontWeight: "700", letterSpacing: 1, color: "#f43f5e" }}>DAILY</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShareVisible(true)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityLabel="Share word"
          >
            <IconSymbol name="square.and.arrow.up" size={14} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244, 63, 94, 0.1)" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#f43f5e" }}>
            {word.word[0] ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: M.text }} numberOfLines={1}>
            {word.word}
          </Text>
          <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }} numberOfLines={1}>
            {word.english}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color="#f43f5e" />
      </View>

      {/* CTA strip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: M.border,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <IconSymbol name="speaker.wave.2" size={11} color={M.muted} />
          <Text style={{ fontSize: 11, color: M.muted }}>Listen</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <IconSymbol name="mic" size={11} color={M.muted} />
          <Text style={{ fontSize: 11, color: M.muted }}>Record</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <IconSymbol name="pencil" size={11} color={M.muted} />
          <Text style={{ fontSize: 11, color: M.muted }}>Write a sentence</Text>
        </View>
      </View>
    </Pressable>

    <ShareModal
      visible={shareVisible}
      onClose={() => setShareVisible(false)}
      data={{
        template: "word",
        word: word.word,
        translation: word.english,
        language: languageId,
        pronunciation: word.pronunciation ?? undefined,
      }}
    />
    </>
  );
}
