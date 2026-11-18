import { describe, expect, it } from "vitest";
import {
  calculateWADS,
  calculateStdDev,
  calculateSupplierDelayFactor,
  calculateAdjustedLeadTime,
  calculateSafetyStock,
  calculateReorderPoint,
  calculateROQ,
  calculateConfidenceScore,
} from "./smartReorder.Calculatro.ts";

describe("smart reorder calculator", () => {
  describe("calculateWADS", () => {
    it("returns 0 when there is no sales history", () => {
      expect(calculateWADS([])).toBe(0);
    });

    it("weights recent days more heavily than older days", () => {
      // weights are 1/6, 2/6, 3/6 for [oldest, middle, newest]
      expect(calculateWADS([0, 0, 10])).toBeCloseTo(5, 10);
      expect(calculateWADS([10, 0, 0])).toBeCloseTo(10 / 6, 10);
    });

    it("returns the constant value when every day is identical", () => {
      expect(calculateWADS([10, 10, 10])).toBeCloseTo(10, 10);
    });
  });

  describe("calculateStdDev", () => {
    it("returns 0 for a single observation", () => {
      expect(calculateStdDev([5], 5)).toBe(0);
    });

    it("uses sample variance (n - 1)", () => {
      const sales = [2, 4, 4, 4, 5, 5, 7, 9];
      expect(calculateStdDev(sales, 5)).toBeCloseTo(Math.sqrt(32 / 7), 10);
    });
  });

  describe("lead time", () => {
    it("returns a neutral delay factor when lead time is zero", () => {
      expect(calculateSupplierDelayFactor(5, 0)).toBe(1);
    });

    it("increases the delay factor proportionally", () => {
      expect(calculateSupplierDelayFactor(5, 10)).toBe(1.5);
      expect(calculateSupplierDelayFactor(0, 10)).toBe(1);
    });

    it("applies the delay factor to the base lead time", () => {
      expect(calculateAdjustedLeadTime(10, 1.5)).toBe(15);
    });
  });

  describe("safety stock and reorder point", () => {
    it("uses the 95% service-level z-score", () => {
      expect(calculateSafetyStock(2, 9)).toBeCloseTo(1.645 * 2 * 3, 10);
    });

    it("combines demand during lead time with safety stock", () => {
      expect(calculateReorderPoint(5, 10, 9.87)).toBeCloseTo(59.87, 10);
    });
  });

  describe("calculateROQ", () => {
    it("covers lead time, review period, safety stock, and expiry risk", () => {
      expect(
        calculateROQ({
          wads: 2,
          adjustedLeadTime: 10,
          reviewPeriod: 7,
          safetyStock: 5,
          currentStock: 10,
          expiryRiskUnits: 3,
        }),
      ).toBe(32);
    });

    it("rounds up fractional quantities", () => {
      expect(
        calculateROQ({
          wads: 1.15,
          adjustedLeadTime: 10,
          reviewPeriod: 0,
          safetyStock: 0,
          currentStock: 0,
          expiryRiskUnits: 0,
        }),
      ).toBe(12);
    });

    it("never recommends a negative order", () => {
      expect(
        calculateROQ({
          wads: 0,
          adjustedLeadTime: 10,
          reviewPeriod: 7,
          safetyStock: 0,
          currentStock: 100,
          expiryRiskUnits: 0,
        }),
      ).toBe(0);
    });

    it("respects a minimum order quantity", () => {
      expect(
        calculateROQ({
          wads: 2,
          adjustedLeadTime: 10,
          reviewPeriod: 7,
          safetyStock: 5,
          currentStock: 10,
          expiryRiskUnits: 3,
          moq: 50,
        }),
      ).toBe(50);
    });
  });

  describe("calculateConfidenceScore", () => {
    it("scores full data, low variability, and a reliable supplier highly", () => {
      expect(
        calculateConfidenceScore({
          daysWithSalesData: 30,
          wads: 10,
          sigma: 2,
          supplierReliabilityScore: 100,
        }),
      ).toBe(93);
    });

    it("treats zero demand as maximum uncertainty", () => {
      const score = calculateConfidenceScore({
        daysWithSalesData: 0,
        wads: 0,
        sigma: 0,
        supplierReliabilityScore: 0,
      });
      expect(score).toBe(0);
    });

    it("supports custom weights", () => {
      expect(
        calculateConfidenceScore({
          daysWithSalesData: 30,
          wads: 10,
          sigma: 0,
          supplierReliabilityScore: 100,
          weights: { W1: 0.5, W2: 0, W3: 0.5 },
        }),
      ).toBe(100);
    });
  });
});
