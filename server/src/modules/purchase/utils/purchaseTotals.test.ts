import { describe, expect, it } from "vitest";

import { computePurchaseTotals } from "./purchaseTotals.ts";

describe("computePurchaseTotals", () => {
  it("applies an absolute discount and a VAT percentage", () => {
    expect(
      computePurchaseTotals({
        items: [
          { quantity: 2, purchasePrice: 10 },
          { quantity: 3, purchasePrice: 5.5 },
        ],
        discount: 6.5,
        vatPercent: 13,
      }),
    ).toEqual({
      subtotal: 36.5,
      discount: 6.5,
      taxable: 30,
      vatAmount: 3.9,
      totalAmount: 33.9,
    });
  });

  it("rounds to two decimal places", () => {
    expect(
      computePurchaseTotals({
        items: [{ quantity: 1, purchasePrice: 99.99 }],
        discount: 0,
        vatPercent: 13,
      }),
    ).toEqual({
      subtotal: 99.99,
      discount: 0,
      taxable: 99.99,
      vatAmount: 13,
      totalAmount: 112.99,
    });
  });

  it("supports a zero VAT rate", () => {
    expect(
      computePurchaseTotals({
        items: [{ quantity: 2, purchasePrice: 50 }],
        discount: 10,
        vatPercent: 0,
      }).totalAmount,
    ).toBe(90);
  });
});
