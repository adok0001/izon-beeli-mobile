import type { InteractiveStoryScene } from "../db/schema.js";

/**
 * Referential integrity for a film's branching scene graph: every narrative
 * scene's nextSceneId and every choice's nextSceneId must resolve to a real
 * scene, and choice scenes must actually offer a choice. Enforced at the write
 * boundary (not just in the editor) because a dangling reference that slips
 * through would strand a learner mid-story once published, with nothing else in
 * the pipeline re-checking it. Shared by the culture-item and educator film
 * write paths since interactive stories were folded into `culture_items`.
 *
 * Returns an error string, or null when the graph is sound.
 */
export function findScenesError(
  initialSceneId: string,
  scenes: Record<string, InteractiveStoryScene>
): string | null {
  if (!initialSceneId || !scenes[initialSceneId]) {
    return "initialSceneId must reference an existing scene";
  }

  for (const [key, scene] of Object.entries(scenes)) {
    if (!scene.text?.trim()) return `Scene "${key}" needs text`;
    if (scene.type === "narrative") {
      if (!scene.nextSceneId || !scenes[scene.nextSceneId]) {
        return `Narrative scene "${key}" must lead to an existing scene`;
      }
    } else if (scene.type === "choice") {
      if (!scene.choices || scene.choices.length === 0) {
        return `Choice scene "${key}" needs at least one choice`;
      }
      for (const choice of scene.choices) {
        if (!choice.text?.trim() || !choice.nextSceneId || !scenes[choice.nextSceneId]) {
          return `A choice in scene "${key}" needs text and must lead to an existing scene`;
        }
      }
    } else if (scene.type !== "conclusion") {
      return `Scene "${key}" has an unknown type`;
    }
  }
  return null;
}
