import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./relativeTime";

const baseOptions = {
  timeZone: "Asia/Kathmandu",
  language: "en" as const,
  justNow: "just now",
};

describe("formatRelativeTime", () => {
  it("uses the just-now label for very recent timestamps", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const result = formatRelativeTime("2026-11-23T09:59:40Z", {
      ...baseOptions,
      now,
    });

    expect(result.text).toBe("just now");
    expect(result.isRelative).toBe(true);
  });

  it("formats minutes and hours", () => {
    const now = new Date("2026-11-23T10:00:00Z");

    expect(
      formatRelativeTime("2026-11-23T09:55:00Z", {
        ...baseOptions,
        now,
      }).text,
    ).toBe("5 minutes ago");

    expect(
      formatRelativeTime("2026-11-23T08:00:00Z", {
        ...baseOptions,
        now,
      }).text,
    ).toBe("2 hours ago");
  });

  it("handles future timestamps", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const result = formatRelativeTime("2026-11-23T10:05:00Z", {
      ...baseOptions,
      now,
    });

    expect(result.text).toBe("in 5 minutes");
  });

  it("uses yesterday and N days ago around calendar boundaries", () => {
    const now = new Date("2026-11-23T10:00:00Z");

    expect(
      formatRelativeTime("2026-11-22T10:00:00Z", {
        ...baseOptions,
        now,
      }).text,
    ).toBe("yesterday");

    expect(
      formatRelativeTime("2026-11-20T10:00:00Z", {
        ...baseOptions,
        now,
      }).text,
    ).toBe("3 days ago");
  });

  it("computes day boundaries in the workspace timezone, not UTC", () => {
    const now = new Date("2026-11-23T18:45:00Z");
    const value = "2026-11-22T17:15:00Z";

    expect(
      formatRelativeTime(value, {
        ...baseOptions,
        now,
      }).text,
    ).toBe("2 days ago");

    expect(
      formatRelativeTime(value, {
        ...baseOptions,
        now,
        timeZone: "UTC",
      }).text,
    ).toBe("yesterday");
  });

  it("falls back to the absolute date after the relative window", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const result = formatRelativeTime("2026-10-01T10:00:00Z", {
      ...baseOptions,
      now,
    });

    expect(result.isRelative).toBe(false);
    expect(result.text).toContain("1 Oct 2026");
  });

  it("formats Nepali relative strings", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const result = formatRelativeTime("2026-11-23T08:00:00Z", {
      ...baseOptions,
      now,
      language: "ne",
      justNow: "भर्खरै",
    });

    expect(result.isRelative).toBe(true);
    expect(result.text).not.toBe("2 hours ago");
  });
});
