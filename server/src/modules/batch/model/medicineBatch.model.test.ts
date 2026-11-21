import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import Batch from "./medicineBatch.model.ts";

function buildBatch(overrides: Record<string, unknown> = {}) {
  return new Batch({
    medicineId: new Types.ObjectId(),
    purchaseOrderId: new Types.ObjectId(),
    batchNumber: "BATCH-001",
    manufacturingDate: new Date("2026-01-01T00:00:00Z"),
    expiryDate: new Date("2027-01-01T00:00:00Z"),
    purchasePrice: 10,
    sellingPrice: 12,
    quantityReceived: 10,
    quantityRemaining: 10,
    ...overrides,
  });
}

describe("Batch model", () => {
  it("validates an active batch that still has stock", async () => {
    await expect(buildBatch().validate()).resolves.not.toThrow();
  });

  it("allows an inactive batch when the remaining quantity is zero", async () => {
    await expect(
      buildBatch({ isActive: false, quantityRemaining: 0 }).validate(),
    ).resolves.not.toThrow();
  });

  it("rejects an inactive batch that still has stock", async () => {
    await expect(
      buildBatch({ isActive: false, quantityRemaining: 5 }).validate(),
    ).rejects.toThrow(
      "Batch can only be marked as inactive if quantity remaining is zero",
    );
  });

  it("still rejects an expiry date before the manufacturing date", async () => {
    await expect(
      buildBatch({ expiryDate: new Date("2025-12-31T00:00:00Z") }).validate(),
    ).rejects.toThrow("Expiry date must be greater than manufacturing date");
  });
});
