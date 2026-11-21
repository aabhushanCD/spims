import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import Return from "./return.model.ts";

function buildReturn(overrides: Record<string, unknown> = {}) {
  return new Return({
    salesId: new Types.ObjectId(),
    returnNumber: "RET-000001",
    returnReason: "Customer changed their mind",
    returnedBy: new Types.ObjectId(),
    returnDate: new Date("2026-01-02T00:00:00Z"),
    refundAmount: 322.05,
    returnItems: [
      {
        saleItemId: new Types.ObjectId(),
        medicineId: new Types.ObjectId(),
        batchId: new Types.ObjectId(),
        quantity: 3,
        unitPrice: 100,
        discount: 15,
        VAT: 37.05,
        refundAmount: 322.05,
        condition: "GOOD",
      },
    ],
    ...overrides,
  });
}

describe("Return model", () => {
  it("declares a unique index on returnNumber", () => {
    const indexes = Return.schema.indexes();

    expect(indexes).toContainEqual([
      { returnNumber: 1 },
      { unique: true },
    ]);
  });

  it("requires the embedded VAT amount", async () => {
    await expect(
      buildReturn({
        returnItems: [
          {
            quantity: 1,
            unitPrice: 100,
            discount: 0,
            refundAmount: 113,
            condition: "GOOD",
          },
        ],
      }).validate(),
    ).rejects.toThrow(/VAT/);
  });

  it("validates a complete return document", async () => {
    await expect(buildReturn().validate()).resolves.not.toThrow();
  });

  it("rejects an unknown status", async () => {
    await expect(
      buildReturn({ status: "UNKNOWN" }).validate(),
    ).rejects.toThrow(/status/);
  });
});
