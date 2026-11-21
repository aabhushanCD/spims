import { describe, expect, it, vi } from "vitest";

import { PurchaseOrderItemRepo } from "./purchaseOrderItem.repo.ts";

function buildModel() {
  const save = vi.fn().mockResolvedValue({ _id: "item-1" });
  // A constructor that returns an object overrides `this`, which lets the
  // repository create a document without aliasing `this` in the test.
  const FakeModel = function FakeModel(data: unknown) {
    return { data, save };
  };
  return { model: FakeModel as never, save };
}

describe("PurchaseOrderItemRepo.create", () => {
  it("saves once inside the provided session", async () => {
    const { model, save } = buildModel();
    const repo = new PurchaseOrderItemRepo(model);
    const session = { id: "session" };

    await repo.create(
      {
        purchaseOrderId: "507f1f77bcf86cd799439071",
        medicineId: "507f1f77bcf86cd799439011",
        quantity: 2,
        purchasePrice: 10,
      } as never,
      session as never,
    );

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ session });
  });

  it("saves once without a session", async () => {
    const { model, save } = buildModel();
    const repo = new PurchaseOrderItemRepo(model);

    await repo.create(
      {
        purchaseOrderId: "507f1f77bcf86cd799439071",
        medicineId: "507f1f77bcf86cd799439011",
        quantity: 2,
        purchasePrice: 10,
      } as never,
    );

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith();
  });
});
