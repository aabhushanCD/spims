import { describe, expect, it } from "vitest";

import { buildAuditParams } from "./auditQuery";

describe("buildAuditParams", () => {
  it("omits blank filters", () => {
    expect(
      buildAuditParams({
        action: "  ",
        entityType: "",
        entityId: "  ",
      }),
    ).toEqual({ limit: 20 });
  });

  it("includes set filters", () => {
    expect(
      buildAuditParams({
        action: "USER_DELETED",
        actorId: "actor-1",
        entityType: "USER",
        entityId: "target-1",
        status: "FAILURE",
      }),
    ).toEqual({
      limit: 20,
      action: "USER_DELETED",
      actorId: "actor-1",
      entityType: "USER",
      entityId: "target-1",
      status: "FAILURE",
    });
  });

  it("uses the inclusive end of the selected local day", () => {
    const params = buildAuditParams({
      fromDate: "2026-02-01",
      toDate: "2026-02-28",
    });

    expect(new Date(params.from as string)).toEqual(
      new Date(2026, 1, 1, 0, 0, 0, 0),
    );
    expect(new Date(params.to as string)).toEqual(
      new Date(2026, 1, 28, 23, 59, 59, 999),
    );
  });
});
