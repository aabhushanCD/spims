import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../repo/medicine.repo.ts";
import type { UnitRepo } from "../repo/unit.repo.ts";
import { UnitService } from "./unit.service.ts";

const UNIT_ID = "507f1f77bcf86cd799439011";

describe("UnitService", () => {
  const unitRepo = { findById: vi.fn(), delete: vi.fn() };
  const medicineRepo = { countByUnitId: vi.fn() };
  const createService = () =>
    new UnitService(
      unitRepo as unknown as UnitRepo,
      medicineRepo as unknown as MedicineRepo,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    unitRepo.findById.mockResolvedValue({ _id: UNIT_ID });
  });

  it("blocks deletion when medicines reference the unit", async () => {
    medicineRepo.countByUnitId.mockResolvedValue(1);

    await expect(createService().deleteUnit(UNIT_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(unitRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced unit", async () => {
    medicineRepo.countByUnitId.mockResolvedValue(0);
    unitRepo.delete.mockResolvedValue({ _id: UNIT_ID });

    await expect(createService().deleteUnit(UNIT_ID)).resolves.toMatchObject({
      _id: UNIT_ID,
    });
  });
});
