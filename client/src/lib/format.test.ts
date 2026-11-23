import { describe, expect, it } from "vitest";

import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from "./format";

describe("format helpers", () => {
  it("formats currency with two decimals and a Rs. prefix", () => {
    expect(formatCurrency(1234.5)).toBe("Rs. 1,234.50");
    expect(formatCurrency(Number.NaN)).toBe("Rs. 0.00");
  });

  it("formats compact currency with K, L and Cr suffixes", () => {
    expect(formatCompactCurrency(950)).toBe("Rs. 950.00");
    expect(formatCompactCurrency(1_000)).toBe("Rs. 1K");
    expect(formatCompactCurrency(12_500)).toBe("Rs. 12.5K");
    expect(formatCompactCurrency(1_25_000)).toBe("Rs. 1.3L");
    expect(formatCompactCurrency(12_00_000)).toBe("Rs. 12L");
    expect(formatCompactCurrency(1_20_00_000)).toBe("Rs. 1.2Cr");
  });

  it("formats compact currency for negative and invalid values", () => {
    expect(formatCompactCurrency(-1_25_000)).toBe("Rs. -1.3L");
    expect(formatCompactCurrency(Number.NaN)).toBe("Rs. 0.00");
  });

  it("formats percentages with one decimal", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
    expect(formatPercent(Number.NaN)).toBe("0.0%");
  });

  it("formats dates deterministically through the locale formatter", () => {
    const date = new Date("2026-02-10T10:00:00Z");

    expect(formatDate(date)).toBe(date.toLocaleDateString());
    expect(formatDateTime(date)).toBe(date.toLocaleString());
  });
});
