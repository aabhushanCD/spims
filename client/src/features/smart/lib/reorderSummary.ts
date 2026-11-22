import type { ReorderRecommendation } from "../types/smart.types";

/**
 * Must match the server's dashboard/reporting definition of high confidence.
 */
export const HIGH_CONFIDENCE_THRESHOLD = 80;

export interface ReorderSummaryCounts {
  total: number;
  pending: number;
  highConfidence: number;
  units: number;
}

export function summarizeReorderRecommendations(
  recommendations: ReorderRecommendation[],
): ReorderSummaryCounts {
  const pending = recommendations.filter(
    (recommendation) => recommendation.status === "PENDING",
  );

  return {
    total: recommendations.length,
    pending: pending.length,
    highConfidence: pending.filter(
      (recommendation) =>
        recommendation.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD,
    ).length,
    units: pending.reduce(
      (total, recommendation) => total + recommendation.suggestedQuantity,
      0,
    ),
  };
}
