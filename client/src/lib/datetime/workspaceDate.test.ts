import { describe, expect, it } from "vitest";

import {
  formatDateParts,
  formatWeekday,
  getZonedParts,
  isNepalTimeZone,
  resolveEffectiveMode,
} from "./workspaceDate";

const nepalConfig = {
  timeZone: "Asia/Kathmandu",
  mode: "both" as const,
  language: "en" as const,
};

describe("workspace date handling", () => {
  it("reads calendar parts in the workspace timezone", () => {
    const instant = new Date("2026-11-23T18:30:00Z");

    expect(getZonedParts(instant, "Asia/Kathmandu")).toMatchObject({
      year: 2026,
      month: 11,
      day: 24,
      hour: 0,
      minute: 15,
    });

    expect(getZonedParts(instant, "UTC")).toMatchObject({
      year: 2026,
      month: 11,
      day: 23,
      hour: 18,
    });
  });

  it("converts a known Gregorian date to Bikram Sambat", () => {
    const parts = formatDateParts("2023-07-08", nepalConfig);

    expect(parts.primary).toContain("2080");
    expect(parts.secondary).toBe("8 Jul 2023");
    expect(parts.isBs).toBe(true);
  });

  it("formats date-only values without timezone shifts", () => {
    const parts = formatDateParts("2026-02-10", {
      timeZone: "America/New_York",
      mode: "ad",
      language: "en",
    });

    expect(parts.primary).toBe("10 Feb 2026");
  });

  it("uses BS for auto mode in Nepal and AD elsewhere", () => {
    expect(resolveEffectiveMode("auto", "Asia/Kathmandu")).toBe("both");
    expect(resolveEffectiveMode("auto", "UTC")).toBe("ad");
    expect(resolveEffectiveMode("bs", "UTC")).toBe("bs");
    expect(resolveEffectiveMode("ad", "Asia/Kathmandu")).toBe("ad");
  });

  it("detects the Nepal timezone", () => {
    expect(isNepalTimeZone("Asia/Kathmandu")).toBe(true);
    expect(isNepalTimeZone("UTC")).toBe(false);
    expect(isNepalTimeZone("Not/AZone")).toBe(false);
  });

  it("falls back to AD outside the supported BS range", () => {
    const parts = formatDateParts("1800-01-01", nepalConfig);

    expect(parts.isBs).toBe(false);
    expect(parts.primary).toContain("1800");
  });

  it("formats the weekday in the workspace timezone", () => {
    const instant = new Date("2026-11-23T18:30:00Z");

    expect(formatWeekday(instant, "Asia/Kathmandu", "en")).toBe("Tuesday");
    expect(formatWeekday(instant, "UTC", "en")).toBe("Monday");
  });

  it("formats Devanagari BS dates for Nepali", () => {
    const parts = formatDateParts("2023-07-08", {
      ...nepalConfig,
      language: "ne",
    });

    expect(parts.primary).toMatch(/[०-९]/);
  });
});
