import type mongoose from "mongoose";
import type { IPurchaseOrderItem } from "../model/purchaseOrderItem.model.ts";
import type PurchaseOrderItem from "../model/purchaseOrderItem.model.ts";
import type {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from "../schema/purchaseOrderItem.schema.js";

export class PurchaseOrderItemRepo {
  constructor(
    private readonly purchaseOrderItemModel: typeof PurchaseOrderItem,
  ) {}

  async create(
    purchaseOrderItemData: CreatePurchaseOrderItemDto,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrderItem> {
    const purchaseOrderItem = new this.purchaseOrderItemModel(
      purchaseOrderItemData,
    );
    if (session) {
      await purchaseOrderItem.save({ session });
    }
    return await purchaseOrderItem.save();
  }

  async findById(id: string): Promise<IPurchaseOrderItem | null> {
    return await this.purchaseOrderItemModel.findById(id).exec();
  }

  async findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<IPurchaseOrderItem[]> {
    return await this.purchaseOrderItemModel
      .find({ purchaseOrderId })
      .populate("medicineId")
      .lean()
      .exec();
  }
  
  
  async findByPurchaseOrderAndMedicine(
    purchaseOrderId: string,
    medicineId: string,
  ) {
    return await this.purchaseOrderItemModel
      .findOne({ purchaseOrderId, medicineId })
      .lean()
      .exec();
  }
  async update(
    id: string,
    updateData: UpdatePurchaseOrderItemDto,
  ): Promise<IPurchaseOrderItem | null> {
    return await this.purchaseOrderItemModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<IPurchaseOrderItem | null> {
    return await this.purchaseOrderItemModel.findByIdAndDelete(id).exec();
  }
}
