import { describe, expect, it } from "vitest";
import {
  MIN_POSITION_GAP,
  POSITION_STEP,
  needsRebalance,
  positionBetween,
  positionForIndex,
} from "@/lib/position";

describe("positionBetween", () => {
  it("starts an empty column at one step", () => {
    expect(positionBetween(null, null)).toBe(POSITION_STEP);
  });

  it("goes one step above the first item when dropped at the top", () => {
    expect(positionBetween(null, 2048)).toBe(2048 - POSITION_STEP);
  });

  it("goes one step below the last item when dropped at the bottom", () => {
    expect(positionBetween(3072, null)).toBe(3072 + POSITION_STEP);
  });

  it("uses the midpoint between two neighbors", () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });
});

describe("needsRebalance", () => {
  it("is false when either side is open", () => {
    expect(needsRebalance(null, 5)).toBe(false);
    expect(needsRebalance(5, null)).toBe(false);
    expect(needsRebalance(null, null)).toBe(false);
  });

  it("is false while there is room between neighbors", () => {
    expect(needsRebalance(1, 2)).toBe(false);
  });

  it("is true once the gap is too small to split", () => {
    expect(needsRebalance(1, 1 + MIN_POSITION_GAP / 10)).toBe(true);
  });

  it("is true when neighbors are out of order", () => {
    expect(needsRebalance(5, 3)).toBe(true);
  });
});

describe("positionForIndex", () => {
  it("spaces items evenly starting at one step", () => {
    expect([0, 1, 2].map(positionForIndex)).toEqual([1024, 2048, 3072]);
  });
});
