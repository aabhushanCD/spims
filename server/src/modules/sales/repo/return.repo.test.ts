import { describe, expect, it, vi } from "vitest";

import { ReturnRepo } from "./return.repo.ts";

function buildRepo() {
  const exec = vi.fn().mockResolvedValue([]);
  const lean = vi.fn().mockReturnValue({ exec });
  const session = vi.fn().mockReturnValue({ lean });

  const find = vi.fn().mockReturnValue({ lean });
  const findOneAndUpdate = vi.fn().mockReturnValue({ lean });
  const exists = vi.fn().mockResolvedValue({ _id: "return-1" });
  const aggregate = vi.fn().mockReturnValue({ session });

  const model = {
    find,
    findOneAndUpdate,
    exists,
    aggregate,
  };

  return {
    repo: new ReturnRepo(model as never),
    model,
    find,
    findOneAndUpdate,
    exists,
    aggregate,
    session,
  };
}

describe("ReturnRepo", () => {
  it("filters the list by status", async () => {
    const { repo, find } = buildRepo();

    await repo.findAll("PENDING");

    expect(find).toHaveBeenCalledWith({ status: "PENDING" });
  });

  it("lists everything when no status is supplied", async () => {
    const { repo, find } = buildRepo();

    await repo.findAll();

    expect(find).toHaveBeenCalledWith({});
  });

  it("transitions status only from the expected state", async () => {
    const { repo, findOneAndUpdate } = buildRepo();

    await repo.transitionStatus(
      "507f1f77bcf86cd799439061",
      "PENDING",
      "APPROVED",
    );

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "507f1f77bcf86cd799439061",
        status: "PENDING",
      },
      { status: "APPROVED" },
      { new: true },
    );
  });

  it("aggregates outstanding quantities for PENDING and APPROVED returns", async () => {
    const { repo, aggregate, session } = buildRepo();
    session.mockResolvedValue([
      { _id: { toString: () => "item-1" }, quantity: 4 },
    ]);

    const result = await repo.sumOutstandingBySaleItemIds([
      "507f1f77bcf86cd799439051",
    ]);

    expect(result).toEqual([{ saleItemId: "item-1", quantity: 4 }]);
    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: {
        status: { $in: ["PENDING", "APPROVED"] },
        "returnItems.saleItemId": { $in: [expect.anything()] },
      },
    });
  });

  it("totals refunds only for COMPLETED returns", async () => {
    const { repo, aggregate, session } = buildRepo();
    session.mockResolvedValue([{ total: 322.05 }]);

    await expect(repo.getTotalRefundAmount()).resolves.toBe(322.05);

    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({ $match: { status: "COMPLETED" } });
  });

  it("aggregates refunds only for COMPLETED returns", async () => {
    const { repo, aggregate, session } = buildRepo();
    session.mockResolvedValue([
      { grossRefunds: 322.05, refundVat: 37.05 },
    ]);

    const result = await repo.getRefundTotalsInRange(
      new Date("2026-02-01T00:00:00Z"),
      new Date("2026-03-01T00:00:00Z"),
    );

    expect(result).toEqual({ grossRefunds: 322.05, refundVat: 37.05 });
    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: {
        status: "COMPLETED",
        returnDate: {
          $gte: new Date("2026-02-01T00:00:00Z"),
          $lt: new Date("2026-03-01T00:00:00Z"),
        },
      },
    });
  });

  it("detects returns that still reference a sale", async () => {
    const { repo, exists } = buildRepo();

    await expect(
      repo.hasActiveBySale("507f1f77bcf86cd799439041"),
    ).resolves.toBe(true);
    expect(exists).toHaveBeenCalledWith({
      salesId: expect.anything(),
      status: { $in: ["PENDING", "APPROVED", "COMPLETED"] },
    });
  });
});
