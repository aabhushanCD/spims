import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../repo/medicine.repo.ts";
import type { CategoryRepo } from "../repo/category.repo.ts";
import { CategoryService } from "./category.service.ts";

const CATEGORY_ID = "507f1f77bcf86cd799439011";

describe("CategoryService", () => {
  const categoryRepo = { findById: vi.fn(), delete: vi.fn() };
  const medicineRepo = { countByCategoryId: vi.fn() };
  const createService = () =>
    new CategoryService(
      categoryRepo as unknown as CategoryRepo,
      medicineRepo as unknown as MedicineRepo,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    categoryRepo.findById.mockResolvedValue({ _id: CATEGORY_ID });
  });

  it("blocks deletion when medicines reference the category", async () => {
    medicineRepo.countByCategoryId.mockResolvedValue(1);

    await expect(
      createService().deleteCategory(CATEGORY_ID),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(categoryRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced category", async () => {
    medicineRepo.countByCategoryId.mockResolvedValue(0);
    categoryRepo.delete.mockResolvedValue({ _id: CATEGORY_ID });

    await expect(
      createService().deleteCategory(CATEGORY_ID),
    ).resolves.toMatchObject({ _id: CATEGORY_ID });
  });
});
