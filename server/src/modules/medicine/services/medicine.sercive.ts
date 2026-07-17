import { AppError } from "../../../shared/error.js";
import type { MedicineRepo } from "../repo/medicine.repo.js";
import type {
  CreateMedicineDto,
  UpdateMedicineDto,
} from "../schema/medicine.schema.js";
import type { BrandService } from "./brand.service.js";
import type { CategoryService } from "./category.service.js";
import type { GenericNameService } from "./genericName.service.js";

export class MedicineService {
  constructor(
    private readonly medicineRepo: MedicineRepo,
    private readonly appError: typeof AppError,
    private readonly genericNameService: GenericNameService,
    private readonly brandService: BrandService,
    private readonly categoryService: CategoryService,
  ) {}

  async createMedicine(medicineData: CreateMedicineDto) {
    await this.categoryService.getCategoryById(medicineData.categoryId);
    await this.genericNameService.getGenericNameById(
      medicineData.genericNameId,
    );
    await this.brandService.getBrandById(medicineData.brandId);

    if (medicineData.barcode) {
      const existing = await this.medicineRepo.findByBarcode(
        medicineData.barcode,
      );
      if (existing) {
        throw this.appError.conflict("Barcode already exists");
      }
    }
    const existingMedicine = await this.medicineRepo.findByNameAndStrength(
      medicineData.medicineName,
      medicineData.strength,
      medicineData.brandId,
    );

    if (existingMedicine) {
      throw this.appError.conflict(
        "Medicine with this name and strength already exists",
      );
    }

    return this.medicineRepo.create(medicineData);
  }

  async searchMedicines(query: string) {
    return await this.medicineRepo.searchMedicines(query);
  }

 

  async getMedicineById(id: string) {
    const medicine = await this.medicineRepo.findById(id);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }
    return medicine;
  }

  

  async updateMedicine(id: string, updateData: UpdateMedicineDto) {
    await this.getMedicineById(id);
    if (updateData.categoryId) {
      await this.categoryService.getCategoryById(
        updateData.categoryId?.toString(),
      );
    }

    if (updateData.brandId) {
      await this.brandService.getBrandById(updateData.brandId?.toString());
    }

    if (updateData.genericNameId) {
      await this.genericNameService.getGenericNameById(
        updateData.genericNameId?.toString(),
      );
    }

    if (updateData.barcode) {
      const barcodeExists = await this.medicineRepo.findByBarcode(
        updateData.barcode,
      );
      if (barcodeExists && barcodeExists._id.toString() !== id) {
        throw this.appError.conflict("Barcode already exists");
      }
    }

    return this.medicineRepo.update(id, updateData);
  }

  async deactivateMedicine(id: string) {
    const medicine = await this.getMedicineById(id);

    return this.medicineRepo.update(id, { isActive: false });
  }

  async getMedicines() {
    return await this.medicineRepo.findAllWithInventory();
  }
}
