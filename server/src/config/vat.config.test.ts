import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  assertVatConfig,
  getVatPercent,
  getVatRate,
  resolveVatPercent,
} from "./vat.config.ts";

const original = process.env.VAT_PERCENT;

describe("VAT config", () => {
  beforeEach(() => {
    delete process.env.VAT_PERCENT;
  });

  afterAll(() => {
    if (original === undefined) {
      delete process.env.VAT_PERCENT;
    } else {
      process.env.VAT_PERCENT = original;
    }
  });

  it("defaults to 13 percent", () => {
    expect(getVatPercent()).toBe(13);
    expect(getVatRate()).toBe(0.13);
  });

  it("reads a valid override", () => {
    process.env.VAT_PERCENT = "10";
    expect(getVatPercent()).toBe(10);
    expect(getVatRate()).toBe(0.1);
  });

  it("falls back for invalid values", () => {
    expect(resolveVatPercent("not-a-number")).toBe(13);
    expect(resolveVatPercent("101")).toBe(13);
    expect(resolveVatPercent("-1")).toBe(13);
  });

  it("fails fast on an invalid configured value", () => {
    process.env.VAT_PERCENT = "101";
    expect(() => assertVatConfig()).toThrow("VAT_PERCENT");
    process.env.VAT_PERCENT = "12.5";
    expect(() => assertVatConfig()).not.toThrow();
  });
});
