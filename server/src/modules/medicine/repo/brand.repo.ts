import type { Model } from "mongoose";
import type { IBrand } from "../models/brand.model.js";
import type { CreateBrandDto, UpdateBrandDto } from "../schema/brand.schema.js";

export class BrandRepo {
  constructor(private readonly brandModel: Model<IBrand>) {}

  async create(brandData: CreateBrandDto): Promise<IBrand> {
    const brand = new this.brandModel(brandData);
    await brand.save();
    return brand;
  }

  async findById(id: string): Promise<IBrand | null> {
    return this.brandModel.findById(id).lean().exec();
  }

  async findAll(): Promise<IBrand[]> {
    return this.brandModel.find().lean().exec();
  }

  async findByName(name: string): Promise<IBrand | null> {
    return this.brandModel.findOne({ name }).lean().exec();
  }

  async update(id: string, updateData: UpdateBrandDto): Promise<IBrand | null> {
    return this.brandModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<IBrand | null> {
    return this.brandModel.findByIdAndDelete(id).lean().exec();
  }
}
