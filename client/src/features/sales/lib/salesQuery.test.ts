import { describe, expect, it } from "vitest";

import { buildSalesListParams } from "./salesQuery";

describe("buildSalesListParams", () => {
  it("omits an empty search so the server's min(1) validation passes", () => {
    expect(buildSalesListParams({ search: "" })).toEqual({ limit: 100 });
  });

  it("omits a whitespace-only search", () => {
    expect(buildSalesListParams({ search: "   " })).toEqual({ limit: 100 });
  });

  it("keeps and trims a real search", () => {
    expect(buildSalesListParams({ search: "  INV-1  " })).toEqual({
      limit: 100,
      search: "INV-1",
    });
  });

  it("works without params", () => {
    expect(buildSalesListParams()).toEqual({ limit: 100 });
  });
});
