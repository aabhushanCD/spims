import { describe, expect, it } from "vitest";

import { buildPurchaseListParams } from "./purchaseQuery";

describe("buildPurchaseListParams", () => {
  it("omits a blank search", () => {
    expect(buildPurchaseListParams({ search: "  " })).toEqual({ limit: 20 });
  });

  it("keeps a trimmed search and filters", () => {
    expect(
      buildPurchaseListParams({
        search: "  INV-1 ",
        status: "approved",
        from: "2026-01-01",
        to: "2026-01-31",
      }),
    ).toEqual({
      limit: 20,
      search: "INV-1",
      status: "approved",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("keeps the cursor", () => {
    expect(buildPurchaseListParams({ cursor: "abc" })).toEqual({
      limit: 20,
      cursor: "abc",
    });
  });
});
