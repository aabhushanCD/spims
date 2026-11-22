import { describe, expect, it } from "vitest";

import {
  buildReportRangeParams,
  csvFilename,
  defaultReportRange,
} from "./reportRange";

describe("reportRange", () => {
  it("defaults to the current month through today", () => {
    const range = defaultReportRange(new Date(2026, 1, 15));

    expect(range).toEqual({ from: "2026-02-01", to: "2026-02-15" });
  });

  it("uses the next local midnight as the exclusive end", () => {
    const range = buildReportRangeParams("2026-02-01", "2026-02-28");

    expect(new Date(range.from)).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    expect(new Date(range.to)).toEqual(new Date(2026, 2, 1, 0, 0, 0, 0));
  });

  it("rejects an inverted range", () => {
    expect(() =>
      buildReportRangeParams("2026-03-01", "2026-02-01"),
    ).toThrow("Choose a valid date range");
  });

  it("builds stable CSV filenames", () => {
    expect(csvFilename("sales", "2026-02-01", "2026-02-28")).toBe(
      "sales-2026-02-01-2026-02-28.csv",
    );
    expect(csvFilename("inventory")).toBe("inventory-snapshot.csv");
  });
});
