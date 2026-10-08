// Fractional indexing: each issue stores a float `position` within its status
// column. Inserting between two neighbors takes the midpoint, so a move updates
// exactly one row. When repeated midpoints exhaust float precision the column
// is renumbered (see `needsRebalance`).

export const POSITION_STEP = 1024;
export const MIN_POSITION_GAP = 1e-6;

/** Position for an item placed between `before` and `after` (null = no neighbor on that side). */
export function positionBetween(before: number | null, after: number | null): number {
  if (before === null) return after === null ? POSITION_STEP : after - POSITION_STEP;
  if (after === null) return before + POSITION_STEP;
  return (before + after) / 2;
}

/** True when the neighbors are too close (or out of order) to split. */
export function needsRebalance(before: number | null, after: number | null): boolean {
  if (before === null || after === null) return false;
  return after - before <= MIN_POSITION_GAP;
}

/** Evenly spaced position for the item at `index` in a renumbered column. */
export function positionForIndex(index: number): number {
  return (index + 1) * POSITION_STEP;
}
