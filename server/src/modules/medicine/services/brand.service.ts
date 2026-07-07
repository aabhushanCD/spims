import { AppError } from "../../../shared/error.js";
import type { BrandRepo } from "../repo/brand.repo.js";
import type { CreateBrandDto, UpdateBrandDto } from "../schema/brand.schema.js";

export class BrandService {
  constructor(
    private readonly brandRepo: BrandRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createBrand(brandData: CreateBrandDto) {
    const existingBrand = await this.brandRepo.findByName(brandData.name);
    if (existingBrand) {
      throw this.appError.conflict("Brand name must be unique");
    }
    try {
      return await this.brandRepo.create(brandData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw this.appError.conflict("Brand name must be unique");
      }
      throw error;
    }
  }

  async getBrandById(id: string) {
    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw this.appError.notFound("Brand not found");
    }
    return brand;
  }

  async getAllBrands() {
    return await this.brandRepo.findAll();
  }

  async updateBrand(id: string, updateData: UpdateBrandDto) {
    const brand = await this.getBrandById(id);
    if (!brand) {
      throw this.appError.notFound("Brand not found");
    }
    return this.brandRepo.update(id, updateData);
  }

  async deleteBrand(id: string) {
    const brand = await this.getBrandById(id);
    if (!brand) {
      throw this.appError.notFound("Brand not found");
    }
    return this.brandRepo.delete(id);
  }
}
