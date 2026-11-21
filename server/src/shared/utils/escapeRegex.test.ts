import { describe, expect, it } from "vitest";

import { escapeRegex } from "./escapeRegex.ts";

describe("escapeRegex", () => {
  it("escapes every regex metacharacter used by search input", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });

  it("treats a crafted pattern as a literal substring", () => {
    const regex = new RegExp(escapeRegex("a.*b"), "i");

    expect(regex.test("a.*b")).toBe(true);
    expect(regex.test("axxxb")).toBe(false);
  });
});
