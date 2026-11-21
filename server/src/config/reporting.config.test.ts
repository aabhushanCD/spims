import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_REPORTING_TIME_ZONE,
  getReportingTimeZone,
  resolveReportingTimeZone,
} from "./reporting.config.ts";

const originalTimeZone = process.env.REPORTING_TIMEZONE;

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.REPORTING_TIMEZONE;
  } else {
    process.env.REPORTING_TIMEZONE = originalTimeZone;
  }
});

describe("reporting timezone configuration", () => {
  it("defaults to Asia/Kathmandu", () => {
    expect(resolveReportingTimeZone(undefined)).toBe(
      DEFAULT_REPORTING_TIME_ZONE,
    );
    expect(resolveReportingTimeZone("  ")).toBe(DEFAULT_REPORTING_TIME_ZONE);
  });

  it("accepts a valid IANA timezone", () => {
    expect(resolveReportingTimeZone("UTC")).toBe("UTC");
  });

  it("rejects an invalid timezone instead of silently shifting reports", () => {
    expect(() => resolveReportingTimeZone("Not/AZone")).toThrow(
      /Invalid REPORTING_TIMEZONE/,
    );
  });

  it("reads the environment on each call", () => {
    process.env.REPORTING_TIMEZONE = "UTC";
    expect(getReportingTimeZone()).toBe("UTC");

    delete process.env.REPORTING_TIMEZONE;
    expect(getReportingTimeZone()).toBe(DEFAULT_REPORTING_TIME_ZONE);
  });
});
