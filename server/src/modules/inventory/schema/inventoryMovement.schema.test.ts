import { describe, expect, it } from "vitest";

import { createInventoryMovementSchema } from "./inventoryMovement.schema.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const REFERENCE_ID = "507f1f77bcf86cd799439031";
const USER_ID = "507f1f77bcf86cd799439041";

describe("inventory movement schema", () => {
  it("fills the default reference type and remarks", () => {
    const parsed = createInventoryMovementSchema.parse({
      medicineId: MEDICINE_ID,
      quantity: 1,
      movementType: "ADJUSTMENT",
      referenceId: REFERENCE_ID,
      performedBy: USER_ID,
    });

    expect(parsed).toMatchObject({
      referenceType: "SYSTEM",
      remarks: "",
    });
  });

  it("accepts every stock reference type used by the model", () => {
    for (const referenceType of [
      "PURCHASE_ORDER",
      "PURCHASE",
      "SALE",
      "RETURN",
      "SALES_RETURN",
      "ADJUSTMENT",
      "RESERVE",
      "RELEASE",
      "SYSTEM",
    ]) {
      expect(
        createInventoryMovementSchema.parse({
          medicineId: MEDICINE_ID,
          quantity: 1,
          movementType: "ADJUSTMENT",
          referenceId: REFERENCE_ID,
          referenceType,
          performedBy: USER_ID,
        }).referenceType,
      ).toBe(referenceType);
    }
  });

  it("rejects unknown reference types and malformed ids", () => {
    expect(() =>
      createInventoryMovementSchema.parse({
        medicineId: MEDICINE_ID,
        quantity: 1,
        movementType: "ADJUSTMENT",
        referenceId: REFERENCE_ID,
        referenceType: "UNKNOWN",
        performedBy: USER_ID,
      }),
    ).toThrow();

    expect(() =>
      createInventoryMovementSchema.parse({
        medicineId: "bad-id",
        quantity: 1,
        movementType: "ADJUSTMENT",
        referenceId: REFERENCE_ID,
        performedBy: USER_ID,
      }),
    ).toThrow();
  });
});
