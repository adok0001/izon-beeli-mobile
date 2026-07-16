import { NewButton } from "@/components/studio/editor-form";
import { SceneEditor, type SceneDraft } from "@/components/studio/interactive-story-scene-editor";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { analyzeGraph, buildFlowLayout, planReorder, type GraphScene } from "@/lib/story-graph";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The interactive story's scene map — the primary surface for authoring a
 * branching story. Scenes are laid out in the order the story actually flows
 * (a DFS from the opening scene along `nextSceneId` / choice targets), branch-
 * indented. Dragging a scene rewrites the `nextSceneId` chain so the new order
 * IS the new flow, within a linear run only (`planReorder` never disturbs a
 * fork). Tapping a scene opens the full `SceneEditor` in a modal — the place to
 * change a choice's branch target. A health strip flags the two ways a graph
 * soft-locks the player (unreachable scenes, dangling links), and a Map/List
 * toggle falls back to the flat scene stack.
 */

type Row = { scene: SceneDraft };

export function StorySceneMap({
  visible,
  scenes,
  initialSceneId,
  onClose,
  onChangeScenes,
  onChangeScene,
  onDeleteScene,
  onSetOpening,
  onAddScene,
  sceneOptionsFor,
  errors,
  t,
}: Readonly<{
  visible: boolean;
  scenes: SceneDraft[];
  initialSceneId: string;
  onClose: () => void;
  /** Reorder result: rewired scenes + (possibly changed) opening scene id. */
  onChangeScenes: (scenes: SceneDraft[], initialSceneId: string) => void;
  onChangeScene: (index: number, updated: SceneDraft) => void;
  onDeleteScene: (index: number) => void;
  onSetOpening: (id: string) => void;
  onAddScene: () => void;
  sceneOptionsFor: (excludeKey: string) => { id: string; label: string }[];
  /** Per-scene validation messages, keyed by scene draft key. */
  errors?: Record<string, string>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}>) {
  const M = useMuseumTheme();
  const [mode, setMode] = useState<"map" | "list">("map");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const graphScenes = scenes as readonly GraphScene[];
  const graph = useMemo(() => analyzeGraph(graphScenes, initialSceneId), [graphScenes, initialSceneId]);
  const layout = useMemo(() => buildFlowLayout(graphScenes, initialSceneId), [graphScenes, initialSceneId]);
  const byId = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes]);
  const depthById = useMemo(() => new Map(layout.map((r) => [r.id, r.depth])), [layout]);
  const incomingById = useMemo(() => new Map(layout.map((r) => [r.id, r.incomingLabel])), [layout]);

  // DraggableFlatList data, in flow order.
  const data = useMemo<Row[]>(
    () => layout.map((r) => byId.get(r.id)).filter((s): s is SceneDraft => !!s).map((scene) => ({ scene })),
    [layout, byId],
  );

  const healthy = graph.unreachable.length === 0 && graph.dangling.length === 0;
  const editingIndex = editingKey ? scenes.findIndex((s) => s.key === editingKey) : -1;
  const editingScene = editingIndex >= 0 ? scenes[editingIndex] : null;

  function handleDragEnd({ data: reordered }: { data: Row[] }) {
    const newOrderIds = reordered.map((r) => r.scene.id);
    const plan = planReorder(graphScenes, initialSceneId, newOrderIds);
    const next = scenes.map((s) => ({
      ...s,
      nextSceneId: plan.nextById[s.id] ?? s.nextSceneId,
      choices: s.choices.map((c) => ({ ...c, nextSceneId: plan.headRemap[c.nextSceneId] ?? c.nextSceneId })),
    }));
    onChangeScenes(next, plan.initialSceneId);
  }

  const health = (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        borderColor: healthy ? M.successBorder : M.errorBorder,
        backgroundColor: healthy ? M.successBg : M.errorBg,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: healthy ? M.success : M.error }}>
        {scenes.length === 0
          ? t("educator.interactiveStoriesEditor.mapEmpty", { defaultValue: "No scenes yet — add the opening scene." })
          : healthy
            ? t("educator.interactiveStoriesEditor.mapHealthy", {
                count: graph.nodes.length,
                defaultValue: `All ${graph.nodes.length} scenes reachable, every link resolves.`,
              })
            : [
                graph.unreachable.length > 0
                  ? t("educator.interactiveStoriesEditor.mapUnreachable", {
                      count: graph.unreachable.length,
                      ids: graph.unreachable.join(", "),
                      defaultValue: `${graph.unreachable.length} unreachable: ${graph.unreachable.join(", ")}`,
                    })
                  : null,
                graph.dangling.length > 0
                  ? t("educator.interactiveStoriesEditor.mapDangling", {
                      count: graph.dangling.length,
                      links: graph.dangling.map((e) => `${e.from} → ${e.to}`).join(", "),
                      defaultValue: `${graph.dangling.length} dangling: ${graph.dangling.map((e) => `${e.from} → ${e.to}`).join(", ")}`,
                    })
                  : null,
              ]
                .filter(Boolean)
                .join("\n")}
      </Text>
    </View>
  );

  const toggle = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12 }}>
      {(["map", "list"] as const).map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className="active:opacity-70"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: active ? M.accent : M.card,
              borderWidth: 1,
              borderColor: active ? M.accent : M.border,
            }}
          >
            <IconSymbol name={m === "map" ? "point.topleft.down.curvedto.point.bottomright.up" : "list.bullet"} size={13} color={active ? M.ink : M.sub} />
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: active ? M.ink : M.sub }}>
              {m === "map"
                ? t("educator.interactiveStoriesEditor.mapTab", { defaultValue: "Map" })
                : t("educator.interactiveStoriesEditor.listTab", { defaultValue: "List" })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  function renderNode({ item, drag, isActive }: RenderItemParams<Row>) {
    const scene = item.scene;
    const depth = depthById.get(scene.id) ?? 0;
    const incoming = incomingById.get(scene.id);
    const reachable = !graph.unreachable.includes(scene.id);
    const isOpening = scene.id === initialSceneId && scene.id !== "";
    const out = graph.edges.filter((e) => e.from === scene.id);
    return (
      <ScaleDecorator>
        <View style={{ paddingLeft: 16 + depth * 18, paddingRight: 16, paddingTop: 8 }}>
          {incoming ? (
            <Text style={{ fontSize: 10, color: M.muted, marginBottom: 2, marginLeft: 2 }} numberOfLines={1}>
              {`↳ "${incoming}"`}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 14,
              borderWidth: 1,
              backgroundColor: M.card,
              borderColor: isOpening ? M.accent : reachable ? M.border : M.error,
              opacity: isActive ? 0.9 : 1,
            }}
          >
            <Pressable
              onPressIn={drag}
              hitSlop={8}
              className="active:opacity-60"
              style={{ paddingLeft: 10, paddingRight: 4, paddingVertical: 14, justifyContent: "center" }}
              accessibilityLabel={t("educator.interactiveStoriesEditor.dragHandle", { defaultValue: "Drag to reorder" })}
            >
              <IconSymbol name="line.3.horizontal" size={16} color={M.muted} />
            </Pressable>
            <Pressable
              onPress={() => setEditingKey(scene.key)}
              className="active:opacity-70"
              style={{ flex: 1, paddingVertical: 10, paddingRight: 12, gap: 3 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {isOpening ? <IconSymbol name="play.fill" size={11} color={M.accent} /> : null}
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                  {scene.title.trim() || scene.id}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: M.muted }}>
                  {scene.type}
                </Text>
                <IconSymbol name="chevron.right" size={13} color={M.muted} />
              </View>
              {!reachable ? (
                <Text style={{ fontSize: 11, fontWeight: "700", color: M.error }}>
                  {t("educator.interactiveStoriesEditor.mapNodeUnreachable", { defaultValue: "Unreachable from the opening scene" })}
                </Text>
              ) : null}
              {errors?.[scene.key] ? (
                <Text style={{ fontSize: 11, fontWeight: "700", color: M.error }}>{errors[scene.key]}</Text>
              ) : null}
              {out.map((e, i) => (
                <View key={`${e.to}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <IconSymbol name="arrow.turn.down.right" size={11} color={e.dangling ? M.error : M.muted} />
                  <Text style={{ flex: 1, fontSize: 11.5, color: e.dangling ? M.error : M.sub }} numberOfLines={1}>
                    {e.label ? `"${e.label}" → ` : "→ "}
                    {byId.get(e.to)?.title?.trim() || e.to}
                    {e.dangling ? t("educator.interactiveStoriesEditor.mapMissingSuffix", { defaultValue: "  (missing)" }) : ""}
                  </Text>
                </View>
              ))}
              {out.length === 0 && scene.type !== "conclusion" ? (
                <Text style={{ fontSize: 11, color: M.warning }}>
                  {t("educator.interactiveStoriesEditor.mapNoOutgoing", { defaultValue: "No outgoing link" })}
                </Text>
              ) : null}
            </Pressable>
          </View>
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: M.text }}>
            {t("educator.interactiveStoriesEditor.mapTitle", { defaultValue: "Story map" })}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <IconSymbol name="xmark" size={20} color={M.sub} />
          </Pressable>
        </View>

        {toggle}
        {health}

        {mode === "map" ? (
          <DraggableFlatList<Row>
            data={data}
            keyExtractor={(item) => item.scene.key}
            onDragEnd={handleDragEnd}
            renderItem={renderNode}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListFooterComponent={
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <NewButton label={t("educator.interactiveStoriesEditor.addScene")} onPress={onAddScene} M={M} />
              </View>
            }
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}>
            {scenes.map((scene, index) => (
              <SceneEditor
                key={scene.key}
                index={index}
                scene={scene}
                sceneOptions={sceneOptionsFor(scene.key)}
                isOpening={scene.id === initialSceneId && scene.id !== ""}
                onChange={(updated) => onChangeScene(index, updated)}
                onDelete={() => onDeleteScene(index)}
                onSetOpening={() => onSetOpening(scene.id)}
                error={errors?.[scene.key]}
                M={M}
                t={t}
              />
            ))}
            <NewButton label={t("educator.interactiveStoriesEditor.addScene")} onPress={onAddScene} M={M} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Tap-to-edit modal — the place to retarget a choice's branch. */}
      <Modal visible={!!editingScene} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingKey(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: M.border, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: M.text }}>
              {t("educator.interactiveStoriesEditor.editSceneTitle", { defaultValue: "Edit scene" })}
            </Text>
            <Pressable onPress={() => setEditingKey(null)} hitSlop={8} className="active:opacity-60">
              <Text style={{ fontSize: 15, fontWeight: "700", color: M.accent }}>{t("common.done")}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {editingScene ? (
              <SceneEditor
                index={editingIndex}
                scene={editingScene}
                sceneOptions={sceneOptionsFor(editingScene.key)}
                isOpening={editingScene.id === initialSceneId && editingScene.id !== ""}
                onChange={(updated) => onChangeScene(editingIndex, updated)}
                onDelete={() => {
                  onDeleteScene(editingIndex);
                  setEditingKey(null);
                }}
                onSetOpening={() => onSetOpening(editingScene.id)}
                error={errors?.[editingScene.key]}
                M={M}
                t={t}
              />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
}
