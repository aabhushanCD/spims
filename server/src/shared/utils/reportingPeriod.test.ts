import { describe, expect, it } from "vitest";

import {
  getCurrentMonthRange,
  getElapsedMonthsInYear,
  getMonthRange,
  getPreviousMonthRange,
  getYearRange,
  getZonedParts,
  zonedDateTimeToUtc,
} from "./reportingPeriod.ts";

describe("reporting periods", () => {
  it("converts Kathmandu local midnight to the correct UTC instant", () => {
    expect(
      zonedDateTimeToUtc({ year: 2026, month: 1, day: 1 }, "Asia/Kathmandu"),
    ).toEqual(new Date("2025-12-31T18:15:00.000Z"));
  });

  it("builds a half-open month range in Kathmandu", () => {
    const range = getMonthRange(2026, 2, "Asia/Kathmandu");

    expect(range.start).toEqual(new Date("2026-01-31T18:15:00.000Z"));
    expect(range.endExclusive).toEqual(
      new Date("2026-02-28T18:15:00.000Z"),
    );
  });

  it("handles the year boundary in a month range", () => {
    const range = getMonthRange(2026, 12, "Asia/Kathmandu");

    expect(range.start).toEqual(new Date("2026-11-30T18:15:00.000Z"));
    expect(range.endExclusive).toEqual(
      new Date("2026-12-31T18:15:00.000Z"),
    );
  });

  it("builds a year range in Kathmandu", () => {
    const range = getYearRange(2026, "Asia/Kathmandu");

    expect(range.start).toEqual(new Date("2025-12-31T18:15:00.000Z"));
    expect(range.endExclusive).toEqual(
      new Date("2026-12-31T18:15:00.000Z"),
    );
  });

  it("uses the timezone to decide the current month", () => {
    // 2026-01-31T19:00Z is already 2026-02-01 in Kathmandu.
    const now = new Date("2026-01-31T19:00:00.000Z");
    expect(getZonedParts(now, "Asia/Kathmandu")).toMatchObject({
      year: 2026,
      month: 2,
      day: 1,
      hour: 0,
      minute: 45,
    });

    const range = getCurrentMonthRange(now, "Asia/Kathmandu");
    expect(range.start).toEqual(new Date("2026-01-31T18:15:00.000Z"));
  });

  it("finds the previous month across a year boundary", () => {
    const range = getPreviousMonthRange(
      new Date("2026-01-15T12:00:00.000Z"),
      "Asia/Kathmandu",
    );

    expect(range.start).toEqual(new Date("2025-11-30T18:15:00.000Z"));
    expect(range.endExclusive).toEqual(
      new Date("2025-12-31T18:15:00.000Z"),
    );
  });

  it("handles DST in another timezone", () => {
    expect(
      getMonthRange(2026, 3, "America/New_York").start,
    ).toEqual(new Date("2026-03-01T05:00:00.000Z"));
    expect(
      getMonthRange(2026, 4, "America/New_York").start,
    ).toEqual(new Date("2026-04-01T04:00:00.000Z"));
  });

  it("counts elapsed months for past, current, and future years", () => {
    const now = new Date("2026-02-15T12:00:00.000Z");

    expect(getElapsedMonthsInYear(2025, now, "Asia/Kathmandu")).toBe(12);
    expect(getElapsedMonthsInYear(2026, now, "Asia/Kathmandu")).toBe(2);
    expect(getElapsedMonthsInYear(2027, now, "Asia/Kathmandu")).toBe(0);
  });

  it("rejects invalid month input", () => {
    expect(() => getMonthRange(2026, 13, "UTC")).toThrow(RangeError);
  });
});
