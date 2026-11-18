import { describe, expect, it } from "vitest";
import { isDuplicateKeyError } from "./mongoError.ts";

describe("isDuplicateKeyError", () => {
  it("returns true for a MongoDB duplicate-key error", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it("returns false for a different MongoDB error code", () => {
    expect(isDuplicateKeyError({ code: 121 })).toBe(false);
  });

  it("returns false for errors without a code", () => {
    expect(isDuplicateKeyError(new Error("boom"))).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError(undefined)).toBe(false);
    expect(isDuplicateKeyError("11000")).toBe(false);
  });
});
