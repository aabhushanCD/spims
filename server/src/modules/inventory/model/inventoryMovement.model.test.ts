import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import InventoryMovement from "./inventoryMovement.model.ts";

const REFERENCE_TYPES = [
  "PURCHASE_ORDER",
  "PURCHASE",
  "SALE",
  "RETURN",
  "SALES_RETURN",
  "ADJUSTMENT",
  "RESERVE",
  "RELEASE",
  "PURCHASE_RETURN",
  "SYSTEM",
] as const;

function buildMovement(referenceType: string) {
  return new InventoryMovement({
    medicineId: new Types.ObjectId(),
    movementType: "RETURN",
    quantity: 1,
    referenceId: new Types.ObjectId(),
    referenceType,
    performedBy: new Types.ObjectId(),
  });
}

describe("InventoryMovement model", () => {
  it.each(REFERENCE_TYPES)("accepts referenceType %s", async (value) => {
    await expect(buildMovement(value).validate()).resolves.not.toThrow();
  });

  it("rejects an unknown referenceType", async () => {
    await expect(buildMovement("BOGUS").validate()).rejects.toThrow(
      /not a valid enum value/,
    );
  });
});
