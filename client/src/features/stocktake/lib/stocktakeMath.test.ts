import { describe, expect, it } from "vitest";

import { summarizeStocktake } from "./stocktakeMath";

describe("summarizeStocktake", () => {
  it("summarizes short, over, and zero-variance lines", () => {
    expect(
      summarizeStocktake([
        { systemQuantity: 10, countedQuantity: 8 },
        { systemQuantity: 5, countedQuantity: 7 },
        { systemQuantity: 3, countedQuantity: 3 },
      ]),
    ).toEqual({
      lineCount: 3,
      varianceCount: 2,
      unitsShort: 2,
      unitsOver: 2,
      netVariance: 0,
    });
  });

  it("uses a supplied variance when present", () => {
    expect(
      summarizeStocktake([
        { systemQuantity: 10, countedQuantity: 10, variance: -3 },
      ]),
    ).toMatchObject({
      varianceCount: 1,
      unitsShort: 3,
      netVariance: -3,
    });
  });

  it("handles an empty stocktake", () => {
    expect(summarizeStocktake([])).toEqual({
      lineCount: 0,
      varianceCount: 0,
      unitsShort: 0,
      unitsOver: 0,
      netVariance: 0,
    });
  });
});
