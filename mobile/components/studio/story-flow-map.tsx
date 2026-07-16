import { IconSymbol } from "@/components/ui/icon-symbol";
import { analyzeGraph, type GraphScene } from "@/lib/story-graph";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The interactive story's flow map: every scene as a node card with its
 * outgoing links, plus a health strip flagging unreachable scenes and dangling
 * links — the two ways an invalid graph soft-locks the player. Built on
 * `analyzeGraph`, the client mirror of the server's scene validation.
 */
export function StoryFlowMap({
  visible,
  scenes,
  initialSceneId,
  onClose,
}: Readonly<{
  visible: boolean;
  scenes: readonly GraphScene[];
  initialSceneId: string;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const graph = useMemo(() => analyzeGraph(scenes, initialSceneId), [scenes, initialSceneId]);
  const healthy = graph.unreachable.length === 0 && graph.dangling.length === 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>Story map</Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        {/* Health strip */}
        <View
          style={{
            margin: 16,
            marginBottom: 4,
            borderRadius: 12,
            borderWidth: 1,
            padding: 12,
            borderColor: healthy ? M.successBorder : M.errorBorder,
            backgroundColor: healthy ? M.successBg : M.errorBg,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: healthy ? M.success : M.error }}>
            {healthy
              ? `All ${graph.nodes.length} scenes reachable, every link resolves.`
              : [
                  graph.unreachable.length > 0 ? `${graph.unreachable.length} unreachable scene(s): ${graph.unreachable.join(", ")}` : null,
                  graph.dangling.length > 0 ? `${graph.dangling.length} dangling link(s): ${graph.dangling.map((e) => `${e.from} → ${e.to}`).join(", ")}` : null,
                ]
                  .filter(Boolean)
                  .join("\n")}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {graph.nodes.map((node) => {
            const out = graph.edges.filter((e) => e.from === node.id);
            return (
              <View
                key={node.id}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  padding: 12,
                  backgroundColor: M.card,
                  borderColor: node.reachable ? M.border : M.error,
                  opacity: node.reachable ? 1 : 0.9,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {node.isOpening ? <IconSymbol name="play.fill" size={12} color={M.accent} /> : null}
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                    {node.title}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: M.muted }}>
                    {node.type}
                  </Text>
                </View>
                <Text style={{ marginTop: 2, fontSize: 11, color: M.muted }}>{node.id}</Text>
                {!node.reachable ? (
                  <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "700", color: M.error }}>
                    Unreachable from the opening scene
                  </Text>
                ) : null}
                {out.length > 0 ? (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {out.map((e, i) => (
                      <View key={`${e.to}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <IconSymbol name="arrow.turn.down.right" size={12} color={e.dangling ? M.error : M.muted} />
                        <Text style={{ flex: 1, fontSize: 12, color: e.dangling ? M.error : M.sub }} numberOfLines={1}>
                          {e.label ? `"${e.label}" → ` : "→ "}
                          {e.to}
                          {e.dangling ? "  (missing)" : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : node.type !== "conclusion" ? (
                  <Text style={{ marginTop: 6, fontSize: 11, color: M.warning }}>No outgoing link</Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
