import { describe, expect, it } from "vitest";

import { CreateReturnSchema, UpdateReturnSchema } from "./return.schema.ts";

const SALES_ID = "507f1f77bcf86cd799439011";
const ITEM_ID = "507f1f77bcf86cd799439021";
const USER_ID = "507f1f77bcf86cd799439031";

describe("return schemas", () => {
  it("does not ask the client for performedBy", () => {
    const parsed = CreateReturnSchema.parse({
      salesId: SALES_ID,
      returnReason: "Customer changed their mind",
      returnedBy: USER_ID,
      returnDate: "2026-01-15",
      items: [
        {
          saleItemId: ITEM_ID,
          quantity: 1,
          condition: "GOOD",
        },
      ],
      performedBy: USER_ID,
    });

    expect(parsed).not.toHaveProperty("performedBy");
  });

  it("rejects malformed ids and unknown conditions", () => {
    expect(() =>
      CreateReturnSchema.parse({
        salesId: "bad",
        returnReason: "Customer changed their mind",
        returnedBy: USER_ID,
        returnDate: new Date(),
        items: [
          { saleItemId: ITEM_ID, quantity: 1, condition: "GOOD" },
        ],
      }),
    ).toThrow();

    expect(() =>
      CreateReturnSchema.parse({
        salesId: SALES_ID,
        returnReason: "Customer changed their mind",
        returnedBy: USER_ID,
        returnDate: new Date(),
        items: [
          { saleItemId: ITEM_ID, quantity: 1, condition: "UNKNOWN" },
        ],
      }),
    ).toThrow();
  });

  it("validates return-reason updates", () => {
    expect(UpdateReturnSchema.parse({ returnReason: "Wrong item" })).toEqual({
      returnReason: "Wrong item",
    });
  });
});
