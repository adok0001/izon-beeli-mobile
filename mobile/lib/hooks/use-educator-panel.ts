/**
 * Educator panel data hooks.
 *
 * Re-exports the per-resource hooks under ./educator/ — split out because the
 * combined file had grown past 1,000 lines. Kept as a barrel so the ~13
 * existing call sites across app/(tabs)/educator/* don't need to change.
 */
export * from "./educator/use-stats";
export * from "./educator/use-dictionary";
export * from "./educator/use-courses";
export * from "./educator/use-lessons";
export * from "./educator/use-proverbs";
export * from "./educator/use-cultural";
export * from "./educator/use-etymology";
export * from "./educator/use-story-arcs";
export * from "./educator/use-sentences";
export * from "./educator/use-scenarios";
export * from "./educator/use-reviewer-applications";
export * from "./educator/use-content-workflow";
