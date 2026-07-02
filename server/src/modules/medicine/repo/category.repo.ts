import type { Model } from "mongoose";

import type { ICategory } from "../models/category.model.js";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../schema/category.schema.js";

export class CategoryRepo {
  constructor(private readonly categoryModel: Model<ICategory>) {}

  async create(categoryData: CreateCategoryDto): Promise<any> {
    const category = new this.categoryModel(categoryData);
    await category.save();
    return category;
  }

  async findById(id: string): Promise<any | null> {
    return this.categoryModel.findById(id).lean().exec();
  }

  async findAll(): Promise<any[]> {
    return this.categoryModel.find().lean().exec();
  }

  async findByName(name: string): Promise<any | null> {
    return this.categoryModel.findOne({ name }).lean().exec();
  }

  async update(id: string, updateData: UpdateCategoryDto): Promise<any | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<any | null> {
    return this.categoryModel.findByIdAndDelete(id).lean().exec();
  }
}
