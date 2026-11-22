import type { Model, PipelineStage } from "mongoose";
import { Types } from "mongoose";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";
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
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.medicineModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
  }

  async searchMedicines(query: string): Promise<IMedicine[]> {
    const regex = new RegExp(escapeRegex(query), "i");
    return this.medicineModel
      .find({
        isActive: true,
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
  async findAllWithInventory(
    options: {
      filters?: {
        search?: string;
        isActive?: boolean;
        categoryId?: string;
        brandId?: string;
        genericNameId?: string;
        unitId?: string;
      };
      cursor?: PageCursor | null;
      limit?: number;
    } = {},
  ) {
    const { filters = {}, cursor = null, limit } = options;
    const match: Record<string, unknown> = {
      isActive: filters.isActive ?? true,
    };
    if (filters.categoryId) {
      match.categoryId = new Types.ObjectId(filters.categoryId);
    }
    if (filters.brandId) {
      match.brandId = new Types.ObjectId(filters.brandId);
    }
    if (filters.genericNameId) {
      match.genericNameId = new Types.ObjectId(filters.genericNameId);
    }
    if (filters.unitId) {
      match.unitId = new Types.ObjectId(filters.unitId);
    }
    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search), "i");
      match.$or = [
        { medicineName: regex },
        { strength: regex },
        { manufacturer: regex },
        { barcode: regex },
      ];
    }

    const pipeline: PipelineStage[] = [{ $match: match }];
    if (cursor) {
      pipeline.push({ $match: cursorFilter("createdAt", cursor) });
    }

    pipeline.push(
      {
        $lookup: {
          from: "inventories",
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
        $unwind: {
          path: "$genericName",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$unit",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          medicineName: 1,
          strength: 1,
          reorderLevel: 1,
          manufacturer: 1,
          barcode: 1,
          createdAt: 1,
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
    );

    if (limit !== undefined) {
      pipeline.push({ $sort: { createdAt: -1, _id: -1 } }, { $limit: limit });
    }

    return this.medicineModel.aggregate(pipeline);
  }

  async countByBrandId(brandId: string): Promise<number> {
    return this.medicineModel.countDocuments({ brandId }).exec();
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.medicineModel.countDocuments({ categoryId }).exec();
  }

  async countByGenericNameId(genericNameId: string): Promise<number> {
    return this.medicineModel.countDocuments({ genericNameId }).exec();
  }

  async countByUnitId(unitId: string): Promise<number> {
    return this.medicineModel.countDocuments({ unitId }).exec();
  }
}
