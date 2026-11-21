import { describe, expect, it } from "vitest";

import {
  createInventorySchema,
  decreaseStockSchema,
  increaseStockSchema,
  inventorySearchQuerySchema,
  reserveStockSchema,
  syncInventorySchema,
  updateInventorySchema,
} from "./inventory.schema.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const REFERENCE_ID = "507f1f77bcf86cd799439031";

describe("inventory schemas", () => {
  it("creates an aggregate without client-supplied stock totals", () => {
    const parsed = createInventorySchema.parse({
      medicineId: MEDICINE_ID,
      reservedStock: 2,
      referenceId: REFERENCE_ID,
      referenceType: "ADJUSTMENT",
    });

    expect(parsed).toMatchObject({
      medicineId: MEDICINE_ID,
      reservedStock: 2,
      referenceId: REFERENCE_ID,
      referenceType: "ADJUSTMENT",
    });
  });

  it("rejects derived stock fields sent by a client", () => {
    expect(() =>
      createInventorySchema.parse({
        medicineId: MEDICINE_ID,
        currentStock: 50,
      }),
    ).toThrow();

    expect(() =>
      updateInventorySchema.parse({
        reservedStock: 1,
        availableStock: 20,
      }),
    ).toThrow();
  });

  it("requires a batch and a valid movement type for stock increases", () => {
    expect(
      increaseStockSchema.parse({
        quantity: 3,
        batchId: BATCH_ID,
        referenceId: REFERENCE_ID,
        referenceType: "PURCHASE",
        movementType: "PURCHASE",
      }),
    ).toMatchObject({ movementType: "PURCHASE" });

    expect(() =>
      increaseStockSchema.parse({
        quantity: 3,
        referenceId: REFERENCE_ID,
        referenceType: "PURCHASE",
        movementType: "PURCHASE",
      }),
    ).toThrow();
  });

  it("restricts decrease movement types", () => {
    const parsed = decreaseStockSchema.parse({
      quantity: 1,
      batchId: BATCH_ID,
      referenceId: REFERENCE_ID,
      referenceType: "SALE",
      movementType: "SALE",
    });

    expect(parsed.movementType).toBe("SALE");
    expect(() =>
      decreaseStockSchema.parse({
        quantity: 1,
        batchId: BATCH_ID,
        referenceId: REFERENCE_ID,
        referenceType: "SALE",
        movementType: "PURCHASE",
      }),
    ).toThrow();
  });

  it("allows a reservation without a batch", () => {
    expect(
      reserveStockSchema.parse({
        quantity: 1,
        referenceId: REFERENCE_ID,
        referenceType: "RESERVE",
      }),
    ).toMatchObject({ referenceType: "RESERVE" });
  });

  it("accepts an empty sync body and a search query", () => {
    expect(syncInventorySchema.parse(undefined)).toBeUndefined();
    expect(inventorySearchQuerySchema.parse({ query: " para " })).toEqual({
      query: "para",
    });
    expect(() => inventorySearchQuerySchema.parse({ query: "" })).toThrow();
  });
});
