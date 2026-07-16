/**
 * Pure graph analysis for interactive-story scene graphs — the client mirror
 * of the server's `findScenesError` (scene-validation.ts), extended with
 * reachability. Single source of truth for the editor's flow map, its inline
 * validation, and the publish gate.
 *
 * Dependency-free and side-effect-free so it can be unit-tested in isolation.
 */

export type GraphScene = Readonly<{
  id: string;
  type: string; // "narrative" | "choice" | "conclusion"
  title?: string;
  nextSceneId?: string;
  choices?: readonly { text?: string; nextSceneId?: string }[];
}>;

export type GraphEdge = Readonly<{
  from: string;
  to: string;
  /** Choice text for choice edges; undefined for a narrative "next" edge. */
  label?: string;
  /** The target id doesn't resolve to a scene. */
  dangling: boolean;
}>;

export type GraphNode = Readonly<{
  id: string;
  type: string;
  title: string;
  isOpening: boolean;
  reachable: boolean;
}>;

export type StoryGraph = Readonly<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Scene ids never reachable from the opening scene. */
  unreachable: string[];
  /** Edges whose target id resolves to no scene. */
  dangling: GraphEdge[];
}>;

export function analyzeGraph(scenes: readonly GraphScene[], initialSceneId: string): StoryGraph {
  const byId = new Map(scenes.map((s) => [s.id, s]));

  const edges: GraphEdge[] = [];
  for (const s of scenes) {
    if (s.nextSceneId) {
      edges.push({ from: s.id, to: s.nextSceneId, dangling: !byId.has(s.nextSceneId) });
    }
    for (const c of s.choices ?? []) {
      if (c.nextSceneId) {
        edges.push({ from: s.id, to: c.nextSceneId, label: c.text || undefined, dangling: !byId.has(c.nextSceneId) });
      }
    }
  }

  // BFS from the opening scene over resolving edges.
  const reachable = new Set<string>();
  if (byId.has(initialSceneId)) {
    const queue = [initialSceneId];
    reachable.add(initialSceneId);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const e of edges) {
        if (e.from === current && !e.dangling && !reachable.has(e.to)) {
          reachable.add(e.to);
          queue.push(e.to);
        }
      }
    }
  }

  const nodes: GraphNode[] = scenes.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title || s.id,
    isOpening: s.id === initialSceneId,
    reachable: reachable.has(s.id),
  }));

  return {
    nodes,
    edges,
    unreachable: nodes.filter((n) => !n.reachable).map((n) => n.id),
    dangling: edges.filter((e) => e.dangling),
  };
}
