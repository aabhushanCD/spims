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

  async searchMedicines(query: string): Promise<IMedicine[]> {
    const regex = new RegExp(query, "i");
    return this.medicineModel
      .find({
        $or: [
          { medicineName: regex },
          { strength: regex },
          { manufacturer: regex },
          { barcode: regex },
        ],
      })
      .lean()
      .exec();
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
  async findAllWithInventory() {
    return this.medicineModel.aggregate([
      {
        $lookup: {
          from: "Inventory",
          localField: "_id",
          foreignField: "medicineId",
          as: "inventory",
        },
      },

      {
        $unwind: {
          path: "$inventory",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "genericnames",
          localField: "genericNameId",
          foreignField: "_id",
          as: "genericName",
        },
      },

      {
        $unwind: "$genericName",
      },

      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brand",
        },
      },

      {
        $unwind: "$brand",
      },

      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },

      {
        $unwind: "$category",
      },

      {
        $lookup: {
          from: "units",
          localField: "unitId",
          foreignField: "_id",
          as: "unit",
        },
      },

      {
        $unwind: "$unit",
      },

      {
        $project: {
          medicineName: 1,

          strength: 1,

          reorderLevel: 1,

          manufacturer: 1,

          barcode: 1,

          genericName: "$genericName.name",

          brand: "$brand.name",

          category: "$category.name",

          unit: "$unit.name",

          currentStock: {
            $ifNull: ["$inventory.currentStock", 0],
          },

          availableStock: {
            $ifNull: ["$inventory.availableStock", 0],
          },
        },
      },
    ]);
  }
}
