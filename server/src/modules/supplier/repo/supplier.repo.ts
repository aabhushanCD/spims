import type { Model } from "mongoose";
import type { ISupplier } from "../model/supplier.model.js";
import type {
  CreateSupplierDto,
  UpdateSupplierDto,
} from "../schema/supplier.schema.js";
import type mongoose from "mongoose";

export class SupplierRepo {
  constructor(private supplierModel: Model<ISupplier>) {}

  async create(supplierData: CreateSupplierDto): Promise<ISupplier> {
    const supplier = new this.supplierModel(supplierData);
    return await supplier.save();
  }

  async findById(id: string): Promise<ISupplier | null> {
    return this.supplierModel.findById(id).lean().exec();
  }

  async findByEmail(email: string): Promise<ISupplier | null> {
    return this.supplierModel.findOne({ email }).lean().exec();
  }

  async findByPhone(phone: string): Promise<ISupplier | null> {
    return this.supplierModel.findOne({ phone }).lean().exec();
  }

  async findAll(): Promise<ISupplier[]> {
    return this.supplierModel.find().lean().exec();
  }

  async update(
    id: string,
    supplierData: UpdateSupplierDto,
  ): Promise<ISupplier | null> {
    return this.supplierModel
      .findByIdAndUpdate(id, supplierData, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<ISupplier | null> {
    return this.supplierModel.findByIdAndDelete(id).lean().exec();
  }

  async getTotalSuppliers(
    status?: "active" | "inActive",
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const filter = status ? ({ status } as const) : undefined;
    return this.supplierModel
      .countDocuments(filter)
      .session(session ?? null)
      .exec();
  }
}
