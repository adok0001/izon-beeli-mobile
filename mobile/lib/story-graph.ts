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

/* ------------------------------------------------------------------ *
 * Flow-ordered layout + link-preserving reorder.
 *
 * The Studio map lays scenes out in the order the story actually flows
 * (a DFS from the opening scene along `nextSceneId` / choice targets),
 * and dragging a scene rewrites the `nextSceneId` chain so the new order
 * IS the new flow — never touching branch structure. Reorder is defined
 * only within a *linear narrative segment* (a run of narrative scenes each
 * linked to the next, where every interior scene has exactly one thing
 * pointing at it); at a choice fork the branches are separate segments and
 * a drag across the fork is a no-op.
 * ------------------------------------------------------------------ */

export type FlowRow = Readonly<{
  id: string;
  /** Branch nesting: 0 = main spine, +1 per choice fork descended. */
  depth: number;
  /** Choice text of the edge that first reached this scene, if via a choice. */
  incomingLabel?: string;
  type: string;
  isOpening: boolean;
  reachable: boolean;
}>;

/** Scenes in story-flow order (DFS from the opening scene), branch-indented.
 *  Unreachable scenes are appended at depth 0 so they stay editable. */
export function buildFlowLayout(scenes: readonly GraphScene[], initialSceneId: string): FlowRow[] {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const rows: FlowRow[] = [];
  const visited = new Set<string>();

  const visit = (id: string, depth: number, incomingLabel?: string) => {
    const s = byId.get(id);
    if (!s || visited.has(id)) return;
    visited.add(id);
    rows.push({ id, depth, incomingLabel, type: s.type, isOpening: id === initialSceneId, reachable: true });
    if (s.type === "narrative" && s.nextSceneId) visit(s.nextSceneId, depth);
    for (const c of s.choices ?? []) if (c.nextSceneId) visit(c.nextSceneId, depth + 1, c.text || undefined);
  };
  if (byId.has(initialSceneId)) visit(initialSceneId, 0);

  for (const s of scenes) {
    if (!visited.has(s.id)) {
      rows.push({ id: s.id, depth: 0, type: s.type, isOpening: s.id === initialSceneId, reachable: false });
      visited.add(s.id);
    }
  }
  return rows;
}

type Segment = { ids: string[]; exitTarget: string };

/** The linear narrative segments of the graph. Choice/conclusion scenes are
 *  never part of a segment; a segment is a maximal chain of narrative scenes
 *  each linked to the next where every interior scene has a single incoming. */
function computeSegments(scenes: readonly GraphScene[]): Segment[] {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const incoming = new Map<string, number>();
  for (const s of scenes) incoming.set(s.id, 0);
  const bump = (id?: string) => {
    if (id && incoming.has(id)) incoming.set(id, incoming.get(id)! + 1);
  };
  const narrPredOf = new Map<string, string>();
  const narrPredCount = new Map<string, number>();
  for (const s of scenes) {
    if (s.type === "narrative" && s.nextSceneId) {
      bump(s.nextSceneId);
      if (byId.has(s.nextSceneId)) {
        narrPredCount.set(s.nextSceneId, (narrPredCount.get(s.nextSceneId) ?? 0) + 1);
        narrPredOf.set(s.nextSceneId, s.id);
      }
    }
    for (const c of s.choices ?? []) bump(c.nextSceneId);
  }

  const isHead = (s: GraphScene): boolean => {
    if (s.type !== "narrative") return false;
    if (!narrPredOf.has(s.id)) return true;
    if (incoming.get(s.id) !== 1) return true;
    if ((narrPredCount.get(s.id) ?? 0) !== 1) return true;
    return false;
  };

  const segments: Segment[] = [];
  const seen = new Set<string>();
  for (const s of scenes) {
    if (s.type !== "narrative" || !isHead(s)) continue;
    const ids: string[] = [];
    let cur: GraphScene = s;
    for (;;) {
      ids.push(cur.id);
      seen.add(cur.id);
      const nx = cur.nextSceneId;
      const t = nx ? byId.get(nx) : undefined;
      if (t && t.type === "narrative" && !isHead(t) && narrPredOf.get(t.id) === cur.id) cur = t;
      else break;
    }
    segments.push({ ids, exitTarget: byId.get(ids[ids.length - 1])!.nextSceneId ?? "" });
  }
  // Any narrative scene the head-walk missed (shouldn't happen) — own segment,
  // so its link is still carried through a reorder rather than dropped.
  for (const s of scenes) {
    if (s.type === "narrative" && !seen.has(s.id)) {
      segments.push({ ids: [s.id], exitTarget: s.nextSceneId ?? "" });
      seen.add(s.id);
    }
  }
  return segments;
}

export type RelinkPlan = Readonly<{
  /** New `nextSceneId` for each narrative scene id. */
  nextById: Record<string, string>;
  /** Old-head → new-head for segments whose first scene changed; apply to
   *  every choice target and the opening scene so external links follow. */
  headRemap: Record<string, string>;
  initialSceneId: string;
}>;

/** Given the desired flat order of scene ids, compute the `nextSceneId`
 *  rewrites that realise it without disturbing branch structure. Reorders
 *  only take effect within a linear narrative segment; ids dragged across a
 *  fork keep their original relative position (a no-op). */
export function planReorder(
  scenes: readonly GraphScene[],
  initialSceneId: string,
  newOrderIds: readonly string[],
): RelinkPlan {
  const orderIndex = new Map(newOrderIds.map((id, i) => [id, i] as const));
  const rank = (id: string) => orderIndex.get(id) ?? Number.MAX_SAFE_INTEGER;
  const segments = computeSegments(scenes);

  const headRemap: Record<string, string> = {};
  const segOrdered: string[][] = [];
  for (const seg of segments) {
    const ordered = [...seg.ids].sort((a, b) => rank(a) - rank(b));
    segOrdered.push(ordered);
    if (ordered[0] !== seg.ids[0]) headRemap[seg.ids[0]] = ordered[0];
  }
  const remap = (id: string) => headRemap[id] ?? id;

  const nextById: Record<string, string> = {};
  segments.forEach((seg, i) => {
    const ordered = segOrdered[i];
    const exit = remap(seg.exitTarget);
    ordered.forEach((id, j) => {
      nextById[id] = j < ordered.length - 1 ? ordered[j + 1] : exit;
    });
  });

  return { nextById, headRemap, initialSceneId: remap(initialSceneId) };
}
