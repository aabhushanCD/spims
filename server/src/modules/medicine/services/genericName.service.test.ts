import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../repo/medicine.repo.ts";
import type { GenericNameRepo } from "../repo/genericName.repo.ts";
import { GenericNameService } from "./genericName.service.ts";

const GENERIC_ID = "507f1f77bcf86cd799439011";

describe("GenericNameService", () => {
  const genericNameRepo = { findById: vi.fn(), delete: vi.fn() };
  const medicineRepo = { countByGenericNameId: vi.fn() };
  const createService = () =>
    new GenericNameService(
      genericNameRepo as unknown as GenericNameRepo,
      medicineRepo as unknown as MedicineRepo,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    genericNameRepo.findById.mockResolvedValue({ _id: GENERIC_ID });
  });

  it("blocks deletion when medicines reference the generic name", async () => {
    medicineRepo.countByGenericNameId.mockResolvedValue(1);

    await expect(
      createService().deleteGenericName(GENERIC_ID),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(genericNameRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced generic name", async () => {
    medicineRepo.countByGenericNameId.mockResolvedValue(0);
    genericNameRepo.delete.mockResolvedValue({ _id: GENERIC_ID });

    await expect(
      createService().deleteGenericName(GENERIC_ID),
    ).resolves.toMatchObject({ _id: GENERIC_ID });
  });
});
