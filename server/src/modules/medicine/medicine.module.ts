import { BrandService } from "./services/brand.service.js";
import { CategoryService } from "./services/category.service.js";
import { GenericNameService } from "./services/genericName.service.js";
import { UnitService } from "./services/unit.service.js";
import { MedicineService } from "./services/medicine.sercive.js";

import { AppError } from "../../shared/error.js";
import { MedicineRepo } from "./repo/medicine.repo.js";
import { BrandRepo } from "./repo/brand.repo.js";
import { CategoryRepo } from "./repo/category.repo.js";
import { GenericNameRepo } from "./repo/genericName.repo.js";
import { UnitRepo } from "./repo/unit.repo.js";
import { BrandController } from "./controller/brand.controller.js";
import { CategoryController } from "./controller/category.controller.js";
import { GenericNameController } from "./controller/genericName.controller.js";
import { UnitController } from "./controller/unit.controller.js";
import { MedicineController } from "./controller/medicine.controller.js";

const brandService = new BrandService(BrandRepo, AppError);
const categoryService = new CategoryService(CategoryRepo, AppError);
const genericNameService = new GenericNameService(GenericNameRepo, AppError);
const unitService = new UnitService(UnitRepo, AppError);
const medicineService = new MedicineService(
  MedicineRepo,
  AppError,
  GenericNameService,
  BrandService,
  CategoryService,
);

const brandController = new BrandController(brandService);
const categoryController = new CategoryController(categoryService);
const genericNameController = new GenericNameController(genericNameService);
const unitController = new UnitController(unitService);
const medicineController = new MedicineController(medicineService);
export {
  brandService,
  categoryService,
  genericNameService,
  unitService,
  medicineService,
  brandController,
  categoryController,
  genericNameController,
  unitController,
  medicineController,
};
