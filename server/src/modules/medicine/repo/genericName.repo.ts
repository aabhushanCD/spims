import type { Model } from "mongoose";
import type { IGenericName } from "../models/genericName.model.js";
import type {
  CreateGenericNameDto,
  UpdateGenericNameDto,
} from "../schema/genericName.schema.js";

export class GenericNameRepo {
  constructor(private readonly genericNameModel: Model<IGenericName>) {}

  async create(genericNameData: CreateGenericNameDto): Promise<IGenericName> {
    const genericName = new this.genericNameModel(genericNameData);
    await genericName.save();
    return genericName;
  }

  async findById(id: string): Promise<IGenericName | null> {
    return this.genericNameModel.findById(id).lean().exec();
  }

  async findAll(): Promise<IGenericName[]> {
    return this.genericNameModel.find().lean().exec();
  }

  async findByName(name: string): Promise<IGenericName | null> {
    return this.genericNameModel.findOne({ name }).lean().exec();
  }

  async update(
    id: string,
    updateData: UpdateGenericNameDto,
  ): Promise<IGenericName | null> {
    return this.genericNameModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<IGenericName | null> {
    return this.genericNameModel.findByIdAndDelete(id).lean().exec();
  }
}
