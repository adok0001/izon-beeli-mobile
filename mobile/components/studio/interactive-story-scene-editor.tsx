import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GhostButton, LabeledInput, SmallButton } from "@/components/studio/editor-form";
import type { StorySceneType } from "@/lib/hooks/educator/use-interactive-stories";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Scene/choice graph editor for the Studio Mobile Interactive Story screen
 * (app/(tabs)/educator/interactive-stories.tsx). Split out to keep that
 * screen file under the project's line-count lint threshold.
 */

export type ChoiceDraft = { key: string; id: string; text: string; nextSceneId: string };

export type SceneDraft = {
  key: string;
  id: string;
  type: StorySceneType;
  gradientFrom: string;
  gradientTo: string;
  backgroundEmoji: string;
  title: string;
  text: string;
  nextSceneId: string;
  choices: ChoiceDraft[];
};

let draftCounter = 0;
/** Stable React key for a scene/choice draft, independent of its editable `id`. */
export function nextKey(prefix: string) {
  draftCounter += 1;
  return `${prefix}-${draftCounter}`;
}

function uniqueId(base: string, taken: Set<string>) {
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export function emptyScene(existingIds: Set<string>): SceneDraft {
  return {
    key: nextKey("scene"),
    id: uniqueId("scene", existingIds),
    type: "narrative",
    gradientFrom: "#8B5E1F",
    gradientTo: "#C4862A",
    backgroundEmoji: "📖",
    title: "",
    text: "",
    nextSceneId: "",
    choices: [],
  };
}

export function emptyChoice(existingIds: Set<string>): ChoiceDraft {
  return { key: nextKey("choice"), id: uniqueId("choice", existingIds), text: "", nextSceneId: "" };
}

export const SCENE_TYPES: StorySceneType[] = ["narrative", "choice", "conclusion"];

/** Rewrites every nextSceneId in the graph that pointed at `from` to `to` — keeps
 * links intact when an author renames a scene's id after other scenes already
 * reference it. */
export function retargetSceneId(scenes: SceneDraft[], from: string, to: string): SceneDraft[] {
  return scenes.map((s) => ({
    ...s,
    nextSceneId: s.nextSceneId === from ? to : s.nextSceneId,
    choices: s.choices.map((c) => (c.nextSceneId === from ? { ...c, nextSceneId: to } : c)),
  }));
}

function ScenePicker({
  label,
  value,
  options,
  onSelect,
  M,
  emptyHint,
}: Readonly<{
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
  M: ReturnType<typeof useMuseumTheme>;
  emptyHint: string;
}>) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub, marginBottom: 4 }}>{label}</Text>
      {options.length === 0 ? (
        <Text style={{ fontSize: 12, color: M.muted, fontStyle: "italic" }}>{emptyHint}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {options.map((opt) => {
              const active = opt.id === value;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onSelect(opt.id)}
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: active ? M.accent : M.card,
                    borderWidth: 1,
                    borderColor: active ? M.accent : M.border,
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: active ? M.ink : M.sub }} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ChoiceEditor({
  index,
  choice,
  sceneOptions,
  onChange,
  onDelete,
  M,
  t,
}: Readonly<{
  index: number;
  choice: ChoiceDraft;
  sceneOptions: { id: string; label: string }[];
  onChange: (updated: ChoiceDraft) => void;
  onDelete: () => void;
  M: ReturnType<typeof useMuseumTheme>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}>) {
  return (
    <View style={{ borderRadius: 10, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 10, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 10.5, fontWeight: "700", color: M.sub }}>
          {t("educator.interactiveStoriesEditor.choiceLabel", { number: index + 1 })}
        </Text>
        <SmallButton label={t("educator.interactiveStoriesEditor.removeChoice")} tone="danger" onPress={onDelete} M={M} />
      </View>
      <LabeledInput
        label={t("educator.interactiveStoriesEditor.choiceTextLabel")}
        value={choice.text}
        onChange={(v) => onChange({ ...choice, text: v })}
      />
      <ScenePicker
        label={t("educator.interactiveStoriesEditor.choiceNextLabel")}
        value={choice.nextSceneId}
        options={sceneOptions}
        onSelect={(id) => onChange({ ...choice, nextSceneId: id })}
        M={M}
        emptyHint={t("educator.interactiveStoriesEditor.sceneNextPlaceholder")}
      />
    </View>
  );
}

export function SceneEditor({
  index,
  scene,
  sceneOptions,
  isOpening,
  onChange,
  onDelete,
  onSetOpening,
  M,
  t,
}: Readonly<{
  index: number;
  scene: SceneDraft;
  sceneOptions: { id: string; label: string }[];
  isOpening: boolean;
  onChange: (updated: SceneDraft) => void;
  onDelete: () => void;
  onSetOpening: () => void;
  M: ReturnType<typeof useMuseumTheme>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}>) {
  const typeLabel: Record<StorySceneType, string> = {
    narrative: t("educator.interactiveStoriesEditor.typeNarrative"),
    choice: t("educator.interactiveStoriesEditor.typeChoice"),
    conclusion: t("educator.interactiveStoriesEditor.typeConclusion"),
  };

  function addChoice() {
    const taken = new Set(scene.choices.map((c) => c.id));
    onChange({ ...scene, choices: [...scene.choices, emptyChoice(taken)] });
  }

  function updateChoice(i: number, updated: ChoiceDraft) {
    onChange({ ...scene, choices: scene.choices.map((c, idx) => (idx === i ? updated : c)) });
  }

  function removeChoice(i: number) {
    onChange({ ...scene, choices: scene.choices.filter((_, idx) => idx !== i) });
  }

  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: isOpening ? M.accent : M.border, backgroundColor: M.card, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.sub }}>
            {t("educator.interactiveStoriesEditor.sceneLabel", { number: index + 1 })}
          </Text>
          {isOpening && <Badge label={t("educator.interactiveStoriesEditor.isOpening")} tone="accent" />}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {!isOpening && (
            <SmallButton label={t("educator.interactiveStoriesEditor.setAsOpening")} onPress={onSetOpening} M={M} />
          )}
          <Pressable onPress={onDelete} hitSlop={8}>
            <IconSymbol name="trash" size={16} color={M.error} />
          </Pressable>
        </View>
      </View>

      <LabeledInput
        label={t("educator.interactiveStoriesEditor.sceneIdLabel")}
        value={scene.id}
        onChange={(v) => onChange({ ...scene, id: v.trim() })}
      />

      <ScenePicker
        label={t("educator.interactiveStoriesEditor.sceneTypeLabel")}
        value={scene.type}
        options={SCENE_TYPES.map((type) => ({ id: type, label: typeLabel[type] }))}
        onSelect={(id) => onChange({ ...scene, type: id as StorySceneType })}
        M={M}
        emptyHint=""
      />

      <LabeledInput
        label={t("educator.interactiveStoriesEditor.sceneTitleLabel")}
        value={scene.title}
        onChange={(v) => onChange({ ...scene, title: v })}
      />
      <LabeledInput
        label={t("educator.interactiveStoriesEditor.sceneTextLabel")}
        value={scene.text}
        onChange={(v) => onChange({ ...scene, text: v })}
        multiline
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label={t("educator.interactiveStoriesEditor.sceneBackgroundEmojiLabel")}
            value={scene.backgroundEmoji}
            onChange={(v) => onChange({ ...scene, backgroundEmoji: v })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label={t("educator.interactiveStoriesEditor.sceneGradientFromLabel")}
            value={scene.gradientFrom}
            onChange={(v) => onChange({ ...scene, gradientFrom: v })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label={t("educator.interactiveStoriesEditor.sceneGradientToLabel")}
            value={scene.gradientTo}
            onChange={(v) => onChange({ ...scene, gradientTo: v })}
          />
        </View>
      </View>

      {scene.type === "narrative" && (
        <ScenePicker
          label={t("educator.interactiveStoriesEditor.sceneNextLabel")}
          value={scene.nextSceneId}
          options={sceneOptions}
          onSelect={(id) => onChange({ ...scene, nextSceneId: id })}
          M={M}
          emptyHint={t("educator.interactiveStoriesEditor.sceneNextPlaceholder")}
        />
      )}

      {scene.type === "choice" && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.text }}>
            {t("educator.interactiveStoriesEditor.choicesLabel")}
          </Text>
          {scene.choices.map((choice, i) => (
            <ChoiceEditor
              key={choice.key}
              index={i}
              choice={choice}
              sceneOptions={sceneOptions}
              onChange={(updated) => updateChoice(i, updated)}
              onDelete={() => removeChoice(i)}
              M={M}
              t={t}
            />
          ))}
          <GhostButton label={t("educator.interactiveStoriesEditor.addChoice")} onPress={addChoice} M={M} />
        </View>
      )}
    </View>
  );
}
