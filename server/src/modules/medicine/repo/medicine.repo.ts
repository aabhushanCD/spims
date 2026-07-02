import type { Model } from "mongoose";
import { Types } from "mongoose";
import type { IMedicine } from "../models/medicine.model.js";
import type {
  CreateMedicineDto,
  UpdateMedicineDto,
} from "../schema/medicine.schema.js";

export class MedicineRepo {
  constructor(private readonly medicineModel: Model<IMedicine>) {}

  async create(medicineData: CreateMedicineDto): Promise<IMedicine> {
    const medicine = new this.medicineModel(medicineData);
    await medicine.save();
    return medicine;
  }

  async findById(id: string): Promise<IMedicine | null> {
    return this.medicineModel.findById(id).lean().exec();
  }

  async findAll(): Promise<IMedicine[]> {
    return this.medicineModel.find().lean().exec();
  }

  async findByBarcode(barcode: string): Promise<IMedicine | null> {
    return this.medicineModel.findOne({ barcode }).lean().exec();
  }

  async findByNameAndStrength(
    name: string,
    strength: string,
    brandId: string,
  ): Promise<IMedicine | null> {
    return this.medicineModel
      .findOne({
        medicineName: name.trim(),
        strength: strength.trim(),
        brandId: new Types.ObjectId(brandId),
      })
      .lean()
      .exec();
  }

  async update(
    id: string,
    updateData: UpdateMedicineDto,
  ): Promise<IMedicine | null> {
    return this.medicineModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async deactivate(
    id: string,
    updateData: Partial<UpdateMedicineDto>,
  ): Promise<IMedicine | null> {
    return this.medicineModel
      .findByIdAndUpdate(id, { updateData }, { new: true })
      .lean()
      .exec();
  }
}
