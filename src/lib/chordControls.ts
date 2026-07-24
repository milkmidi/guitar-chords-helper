export type CycleDirection = -1 | 1;
export type CompactSelector = "root" | "chord" | null;

export function cycleIndex(
  current: number,
  length: number,
  direction: CycleDirection,
): number {
  if (length <= 0) return 0;
  return (((current + direction) % length) + length) % length;
}
