import { AppError } from "../../../shared/error.js";
import type { ICategory } from "../models/category.model.js";
import type { CategoryRepo } from "../repo/category.repo.js";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../schema/category.schema.js";

export class CategoryService {
  constructor(
    private readonly categoryRepo:CategoryRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createCategory(categoryData: CreateCategoryDto): Promise<ICategory> {
    const existingCategory = await this.categoryRepo.findByName(
      categoryData.name,
    );
    if (existingCategory) {
      throw this.appError.badRequest("Category name must be unique");
    }
    try {
      return await this.categoryRepo.create(categoryData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw this.appError.conflict("Category name must be unique");
      }
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw this.appError.notFound("Category not found");
    }
    return category;
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.categoryRepo.findAll();
  }

  async updateCategory(id: string, updateData: UpdateCategoryDto) {
    if (Object.keys(updateData).length === 0) {
      throw this.appError.badRequest("No data provided for update");
    }
    const existingCategory = await this.categoryRepo.findById(id);
    if (!existingCategory) {
      throw this.appError.notFound("Category not found");
    }

    return this.categoryRepo.update(id, updateData);
  }

  async deleteCategory(id: string): Promise<ICategory | null> {
    await this.getCategoryById(id);
    return this.categoryRepo.delete(id);
  }
}
