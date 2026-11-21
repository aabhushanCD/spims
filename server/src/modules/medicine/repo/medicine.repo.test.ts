import { describe, expect, it, vi } from "vitest";

import { MedicineRepo } from "./medicine.repo.ts";

function buildRepo() {
  const query = {
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue([]),
  };
  query.lean.mockReturnValue(query);

  const model = {
    find: vi.fn((_filter: unknown) => query),
    aggregate: vi.fn((_pipeline: unknown[]) => Promise.resolve([])),
    countDocuments: vi.fn((_filter: unknown) => query),
  };

  return { repo: new MedicineRepo(model as never), model, query };
}

describe("MedicineRepo", () => {
  it("filters search to active medicines and escapes regex input", async () => {
    const { repo, model } = buildRepo();

    await repo.searchMedicines("a.*b");

    expect(model.find).toHaveBeenCalledOnce();
    const filter = model.find.mock.calls[0]?.[0] as {
      isActive?: boolean;
      $or?: Array<Record<string, RegExp>>;
    };
    expect(filter.isActive).toBe(true);
    const regex = filter.$or?.[0]?.medicineName;
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex?.test("a.*b")).toBe(true);
    expect(regex?.test("axxxb")).toBe(false);
  });

  it("starts the inventory join with an active-medicine match", async () => {
    const { repo, model } = buildRepo();

    await repo.findAllWithInventory();

    const pipeline = model.aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline[0]).toEqual({ $match: { isActive: true } });
  });

  it("counts lookup references", async () => {
    const { repo, model, query } = buildRepo();
    query.exec.mockResolvedValue(3);

    await expect(repo.countByBrandId("brand-1")).resolves.toBe(3);
    expect(model.countDocuments).toHaveBeenCalledWith({ brandId: "brand-1" });
  });
});
