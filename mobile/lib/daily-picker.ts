/**
 * Deterministic daily item picker.
 * Returns the same item for a given day, cycling through the array.
 */
export function getDailyItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;

  const today = new Date();
  // Simple date hash: days since epoch
  const daysSinceEpoch = Math.floor(today.getTime() / 86_400_000);
  const index = daysSinceEpoch % items.length;

  return items[index];
}
