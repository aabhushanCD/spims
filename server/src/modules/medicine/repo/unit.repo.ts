import type { Model } from "mongoose";
import type { IUnit } from "../models/unit.model.js";
import type { CreateUnitDto, UpdateUnitDto } from "../schema/unit.schema.js";

export class UnitRepo {
  constructor(private readonly unitModel: Model<IUnit>) {}
  async create(unitData: CreateUnitDto): Promise<IUnit> {
    const unit = new this.unitModel(unitData);
    await unit.save();
    return unit;
  }

  async findById(id: string): Promise<IUnit | null> {
    return this.unitModel.findById(id).lean().exec();
  }

  async findAll(): Promise<IUnit[]> {
    return this.unitModel.find().lean().exec();
  }

  async findByName(name: string): Promise<IUnit | null> {
    return this.unitModel.findOne({ name }).lean().exec();
  }

  async update(id: string, updateData: UpdateUnitDto): Promise<IUnit | null> {
    return this.unitModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<IUnit | null> {
    return this.unitModel.findByIdAndDelete(id).lean().exec();
  }
}
