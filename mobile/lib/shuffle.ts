// Fisher-Yates shuffle — returns a new array with a uniform random permutation.
// Replaces the biased `[...arr].sort(() => Math.random() - 0.5)` idiom that was
// copy-pasted across the discover game screens.
//
// `rng` is injectable so callers that need reproducible output under test (the
// checkpoint round builder) can seed it, without every other call site caring.
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
