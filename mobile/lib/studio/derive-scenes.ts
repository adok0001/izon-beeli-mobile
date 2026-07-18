import type { SceneOption } from "@/components/studio/scene-assign-sheet";

export type SceneSourceLesson = {
  scene?: string | null;
  sceneTitle?: string | null;
  sceneOrder?: number | null;
  sceneIllustration?: string | null;
  sceneIllustrationUrl?: string | null;
};

/** Groups a course's lessons by `scene` into the ordered set of scenes used across Studio scene UI. */
export function deriveScenes<T extends SceneSourceLesson>(lessons: T[]): SceneOption[] {
  const byScene = new Map<string, SceneOption>();
  for (const l of lessons) {
    if (!l.scene) continue;
    const existing = byScene.get(l.scene);
    if (existing) {
      byScene.set(l.scene, { ...existing, lessonCount: existing.lessonCount + 1 });
    } else {
      byScene.set(l.scene, {
        scene: l.scene,
        sceneTitle: l.sceneTitle ?? null,
        sceneOrder: l.sceneOrder ?? null,
        sceneIllustration: l.sceneIllustration ?? null,
        sceneIllustrationUrl: l.sceneIllustrationUrl ?? null,
        lessonCount: 1,
      });
    }
  }
  return Array.from(byScene.values()).sort((a, b) => (a.sceneOrder ?? 999) - (b.sceneOrder ?? 999));
}
