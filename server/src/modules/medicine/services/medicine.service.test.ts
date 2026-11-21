import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../repo/medicine.repo.ts";
import type { BrandService } from "./brand.service.ts";
import type { CategoryService } from "./category.service.ts";
import type { GenericNameService } from "./genericName.service.ts";
import type { UnitService } from "./unit.service.ts";
import { MedicineService } from "./medicine.sercive.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BRAND_ID = "507f1f77bcf86cd799439021";
const CATEGORY_ID = "507f1f77bcf86cd799439031";
const GENERIC_ID = "507f1f77bcf86cd799439041";
const UNIT_ID = "507f1f77bcf86cd799439051";

const validMedicine = {
  medicineName: "Paracetamol",
  strength: "500mg",
  brandId: BRAND_ID,
  categoryId: CATEGORY_ID,
  genericNameId: GENERIC_ID,
  unitId: UNIT_ID,
  reorderLevel: 10,
  isActive: true,
};

describe("MedicineService", () => {
  const medicineRepo = {
    findByBarcode: vi.fn(),
    findByNameAndStrength: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  };
  const genericNameService = { getGenericNameById: vi.fn() };
  const brandService = { getBrandById: vi.fn() };
  const categoryService = { getCategoryById: vi.fn() };
  const unitService = { getUnitById: vi.fn() };

  const createService = () =>
    new MedicineService(
      medicineRepo as unknown as MedicineRepo,
      AppError,
      genericNameService as unknown as GenericNameService,
      brandService as unknown as BrandService,
      categoryService as unknown as CategoryService,
      unitService as unknown as UnitService,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    medicineRepo.findByBarcode.mockResolvedValue(null);
    medicineRepo.findByNameAndStrength.mockResolvedValue(null);
    medicineRepo.create.mockImplementation((data: unknown) => data);
    unitService.getUnitById.mockResolvedValue({});
  });

  it("checks that the unit exists before creating a medicine", async () => {
    await createService().createMedicine(validMedicine);

    expect(unitService.getUnitById).toHaveBeenCalledWith(UNIT_ID);
    expect(medicineRepo.create).toHaveBeenCalledWith(validMedicine);
  });

  it("stops creation when the unit does not exist", async () => {
    unitService.getUnitById.mockRejectedValue(
      AppError.notFound("Unit not found"),
    );

    await expect(
      createService().createMedicine(validMedicine),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(medicineRepo.create).not.toHaveBeenCalled();
  });

  it("checks a changed unit on update", async () => {
    medicineRepo.findById.mockResolvedValue({ _id: MEDICINE_ID });
    medicineRepo.update.mockResolvedValue({ _id: MEDICINE_ID });

    await createService().updateMedicine(MEDICINE_ID, { unitId: UNIT_ID });

    expect(unitService.getUnitById).toHaveBeenCalledWith(UNIT_ID);
  });
});
