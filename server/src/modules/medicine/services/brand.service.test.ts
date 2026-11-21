import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../repo/medicine.repo.ts";
import type { BrandRepo } from "../repo/brand.repo.ts";
import { BrandService } from "./brand.service.ts";

const BRAND_ID = "507f1f77bcf86cd799439011";

describe("BrandService", () => {
  const brandRepo = { findById: vi.fn(), delete: vi.fn() };
  const medicineRepo = { countByBrandId: vi.fn() };
  const createService = () =>
    new BrandService(
      brandRepo as unknown as BrandRepo,
      medicineRepo as unknown as MedicineRepo,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    brandRepo.findById.mockResolvedValue({ _id: BRAND_ID });
  });

  it("blocks deletion when medicines reference the brand", async () => {
    medicineRepo.countByBrandId.mockResolvedValue(1);

    await expect(createService().deleteBrand(BRAND_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(brandRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced brand", async () => {
    medicineRepo.countByBrandId.mockResolvedValue(0);
    brandRepo.delete.mockResolvedValue({ _id: BRAND_ID });

    await expect(createService().deleteBrand(BRAND_ID)).resolves.toMatchObject({
      _id: BRAND_ID,
    });
  });
});
