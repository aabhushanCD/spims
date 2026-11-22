export interface StocktakeVarianceLine {
  systemQuantity: number;
  countedQuantity: number;
  variance?: number;
}

export interface StocktakeSummary {
  lineCount: number;
  varianceCount: number;
  unitsShort: number;
  unitsOver: number;
  netVariance: number;
}

export function summarizeStocktake(
  items: StocktakeVarianceLine[],
): StocktakeSummary {
  let varianceCount = 0;
  let unitsShort = 0;
  let unitsOver = 0;
  let netVariance = 0;

  for (const item of items) {
    const variance =
      item.variance ?? item.countedQuantity - item.systemQuantity;

    if (variance !== 0) {
      varianceCount += 1;
    }
    if (variance < 0) {
      unitsShort += Math.abs(variance);
    } else {
      unitsOver += variance;
    }
    netVariance += variance;
  }

  return {
    lineCount: items.length,
    varianceCount,
    unitsShort,
    unitsOver,
    netVariance,
  };
}
