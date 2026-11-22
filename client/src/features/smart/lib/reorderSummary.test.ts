import { describe, expect, it } from "vitest";

import type { ReorderRecommendation } from "../types/smart.types";
import {
  HIGH_CONFIDENCE_THRESHOLD,
  summarizeReorderRecommendations,
} from "./reorderSummary";

function recommendation(
  overrides: Partial<ReorderRecommendation> = {},
): ReorderRecommendation {
  return {
    _id: "recommendation-1",
    medicineId: {
      _id: "medicine-1",
      medicineName: "Paracetamol",
    },
    currentStock: 5,
    reorderPoint: 20,
    suggestedQuantity: 30,
    safetyStock: 10,
    confidenceScore: 50,
    recommendationReason: "Below reorder point",
    status: "PENDING",
    generatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeReorderRecommendations", () => {
  it("uses 80 as the high-confidence threshold", () => {
    expect(HIGH_CONFIDENCE_THRESHOLD).toBe(80);

    const summary = summarizeReorderRecommendations([
      recommendation({ _id: "a", confidenceScore: 79 }),
      recommendation({ _id: "b", confidenceScore: 80 }),
    ]);

    expect(summary.highConfidence).toBe(1);
  });

  it("excludes non-pending recommendations from pending, high confidence, and units", () => {
    const summary = summarizeReorderRecommendations([
      recommendation({ _id: "a", confidenceScore: 95, suggestedQuantity: 30 }),
      recommendation({
        _id: "b",
        status: "APPROVED",
        confidenceScore: 95,
        suggestedQuantity: 99,
      }),
      recommendation({
        _id: "c",
        status: "REJECTED",
        confidenceScore: 95,
        suggestedQuantity: 50,
      }),
    ]);

    expect(summary).toEqual({
      total: 3,
      pending: 1,
      highConfidence: 1,
      units: 30,
    });
  });

  it("handles an empty list", () => {
    expect(summarizeReorderRecommendations([])).toEqual({
      total: 0,
      pending: 0,
      highConfidence: 0,
      units: 0,
    });
  });
});
