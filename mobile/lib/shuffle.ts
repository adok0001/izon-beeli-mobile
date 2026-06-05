// Fisher-Yates shuffle — returns a new array with a uniform random permutation.
// Replaces the biased `[...arr].sort(() => Math.random() - 0.5)` idiom that was
// copy-pasted across the discover game screens.
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
