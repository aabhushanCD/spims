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
      return await purchaseOrderItem.save({ session });
    }
    return await purchaseOrderItem.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrderItem | null> {
    if (session) {
      return await this.purchaseOrderItemModel
        .findById(id)
        .session(session)
        .exec();
    }
    return await this.purchaseOrderItemModel.findById(id).exec();
  }

  async findByPurchaseOrderId(
    purchaseOrderId: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrderItem[]> {
    const query = this.purchaseOrderItemModel
      .find({ purchaseOrderId })
      .populate("medicineId")
      .lean();

    return session ? query.session(session).exec() : query.exec();
  }
  
  
  async findByPurchaseOrderAndMedicine(
    purchaseOrderId: string,
    medicineId: string,
    session?: mongoose.ClientSession,
  ) {
    const query = this.purchaseOrderItemModel
      .findOne({ purchaseOrderId, medicineId })
      .lean();

    return session ? query.session(session).exec() : query.exec();
  }
  async update(
    id: string,
    updateData: UpdatePurchaseOrderItemDto,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrderItem | null> {
    if (session) {
      return await this.purchaseOrderItemModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .exec();
    }
    return await this.purchaseOrderItemModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrderItem | null> {
    if (session) {
      return await this.purchaseOrderItemModel
        .findByIdAndDelete(id)
        .session(session)
        .exec();
    }
    return await this.purchaseOrderItemModel.findByIdAndDelete(id).exec();
  }
}
