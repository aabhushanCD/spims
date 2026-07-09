// smartReorderCalculator.ts
const Z_95 = 1.645; // 95% service level

export function calculateWADS(dailySales: number[]): number {
  // day 1 = oldest = dailySales[0], day 30 = today = dailySales[last]
  const n = dailySales.length;

  const weightSum = (n * (n + 1)) / 2; // sum(1..n)
  let wads = 0;
  for (let i = 0; i < n; i++) {
    const dayNumber = i + 1; // 1-indexed, oldest = 1
    const weight = dayNumber / weightSum;
    wads += weight * (dailySales[i] ?? 0);
  }
  return wads;
}

export function calculateStdDev(dailySales: number[], wads: number): number {
  const n = dailySales.length;
  if (n <= 1) return 0;
  const sumSquaredDiff = dailySales.reduce(
    (sum, s) => sum + Math.pow(s - wads, 2),
    0,
  );
  return Math.sqrt(sumSquaredDiff / (n - 1)); // sample variance, n-1
}

export function calculateSupplierDelayFactor(
  avgDelayDays: number,
  baseLeadTime: number,
): number {
  if (baseLeadTime <= 0) return 1;
  return 1 + avgDelayDays / baseLeadTime;
}

export function calculateAdjustedLeadTime(
  baseLeadTime: number,
  sdf: number,
): number {
  return baseLeadTime * sdf;
}

export function calculateSafetyStock(
  sigma: number,
  adjustedLeadTime: number,
): number {
  return Z_95 * sigma * Math.sqrt(adjustedLeadTime);
}

export function calculateReorderPoint(
  wads: number,
  adjustedLeadTime: number,
  safetyStock: number,
): number {
  return wads * adjustedLeadTime + safetyStock;
}

export function calculateROQ(params: {
  wads: number;
  adjustedLeadTime: number;
  reviewPeriod: number;
  safetyStock: number;
  currentStock: number;
  expiryRiskUnits: number;
  moq?: number;
}): number {
  const raw =
    params.wads * (params.adjustedLeadTime + params.reviewPeriod) +
    params.safetyStock -
    params.currentStock +
    params.expiryRiskUnits;
  const flooredAtZero = Math.max(0, Math.ceil(raw));
  return params.moq ? Math.max(flooredAtZero, params.moq) : flooredAtZero;
}

export function calculateConfidenceScore(params: {
  daysWithSalesData: number;
  wads: number;
  sigma: number;
  supplierReliabilityScore: number; // 0-100
  weights?: { W1: number; W2: number; W3: number };
}): number {
  const { W1, W2, W3 } = params.weights ?? { W1: 0.35, W2: 0.35, W3: 0.3 };

  const dataScore = Math.min(params.daysWithSalesData / 30, 1.0);

  // CV undefined when WADS is 0 (no sales at all) — treat as max uncertainty
  const cv = params.wads > 0 ? params.sigma / params.wads : 1.0;
  const demandScore = 1 - Math.min(cv, 1.0);

  const supplierScore = params.supplierReliabilityScore / 100;

  const confidence =
    100 * (W1 * dataScore + W2 * demandScore + W3 * supplierScore);
  return Math.round(confidence * 10) / 10; // 1 decimal place
}
