import { describe, expect, it, vi } from "vitest";

import { InventoryRepo } from "./inventory.repo.ts";

function buildRepo() {
  const model = {
    aggregate: vi.fn().mockResolvedValue([]),
  };

  return { repo: new InventoryRepo(model as never), model };
}

describe("InventoryRepo.searchMedicines", () => {
  it("filters inactive medicines and escapes regex input", async () => {
    const { repo, model } = buildRepo();

    await repo.searchMedicines("a.*b");

    const pipeline = model.aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: { "medicine.isActive": true },
    });

    const searchStage = pipeline.find((stage) => {
      const match = stage.$match as
        | { $or?: Array<Record<string, { $regex?: string }>> }
        | undefined;
      return Array.isArray(match?.$or);
    });

    const item = (
      searchStage?.$match as {
        $or: Array<Record<string, { $regex: string }>>;
      }
    ).$or[0];
    expect(item?.["medicine.medicineName"]?.$regex).toBe("a\\.\\*b");
  });
});
