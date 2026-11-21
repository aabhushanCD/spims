import { describe, expect, it } from "vitest";

import {
  VAT_PERCENT,
  VAT_RATE,
  addVat,
  calculateVat,
  roundCurrency,
} from "./money.ts";

describe("money helpers", () => {
  it("exposes the Nepal VAT rate as both percent and decimal", () => {
    expect(VAT_PERCENT).toBe(13);
    expect(VAT_RATE).toBe(0.13);
  });

  it("rounds to two decimals", () => {
    expect(roundCurrency(12.345)).toBe(12.35);
    expect(roundCurrency(12.344)).toBe(12.34);
    expect(roundCurrency(-1.005)).toBe(-1.01);
    expect(roundCurrency(0)).toBe(0);
    expect(roundCurrency(Number.NaN)).toBe(0);
  });

  it("calculates rounded VAT for a net amount", () => {
    expect(calculateVat(99.99)).toBe(13);
    expect(calculateVat(285)).toBe(37.05);
  });

  it("splits net, VAT, and gross", () => {
    expect(addVat(285)).toEqual({ net: 285, vat: 37.05, gross: 322.05 });
  });
});
