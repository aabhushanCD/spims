import mongoose from "mongoose";
import type { IPurchaseOrder } from "../model/purchaseOrder.model.js";
import type PurchaseOrder from "../model/purchaseOrder.model.js";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";

export class PurchaseOrderRepo {
  constructor(private readonly purchaseOrderModel: typeof PurchaseOrder) {}

  async create(
    purchaseOrderData: Partial<IPurchaseOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder> {
    const purchaseOrder = new this.purchaseOrderModel(purchaseOrderData);
    if (session) {
      return await purchaseOrder.save({ session });
    }
    return await purchaseOrder.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    if (session) {
      return await this.purchaseOrderModel.findById(id).session(session).exec();
    }
    return await this.purchaseOrderModel.findById(id).exec();
  }
  async findPage(
    filters: {
      search?: string;
      status?: IPurchaseOrder["status"];
      supplierId?: string;
      from?: Date;
      to?: Date;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IPurchaseOrder[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.status) {
      conditions.push({ status: filters.status });
    }
    if (filters.supplierId) {
      conditions.push({ supplierId: filters.supplierId });
    }
    if (filters.from || filters.to) {
      conditions.push({
        orderDate: {
          ...(filters.from ? { $gte: filters.from } : {}),
          ...(filters.to ? { $lte: filters.to } : {}),
        },
      });
    }
    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search), "i");
      conditions.push({
        $or: [{ invoiceNumber: regex }, { invoiceFile: regex }],
      });
    }
    const cursorClause = cursorFilter("orderDate", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};

    return this.purchaseOrderModel
      .find(query)
      .populate("supplierId", "companyName")
      .sort({ orderDate: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<IPurchaseOrder[]> {
    if (session) {
      return await this.purchaseOrderModel.find().session(session).exec();
    }
    return await this.purchaseOrderModel
      .find()
      .populate("supplierId", "companyName")
      .lean();
  }

  async findByIdWithSupplier(id: string): Promise<IPurchaseOrder | null> {
    return await this.purchaseOrderModel
      .findById(id)
      .populate("supplierId")
      .lean()
      .exec();
  }

  async findBySupplierId(
    supplierId: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder[]> {
    if (session) {
      return await this.purchaseOrderModel
        .find({ supplierId })
        .session(session)
        .exec();
    }
    return await this.purchaseOrderModel.find({ supplierId }).exec();
  }

  async countOpenBySupplier(supplierId: string): Promise<number> {
    return this.purchaseOrderModel
      .countDocuments({
        supplierId,
        status: { $in: ["pending", "approved"] },
      })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<IPurchaseOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    const options: mongoose.QueryOptions = { new: true };
    if (session) {
      options.session = session;
    }
    return this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, options)
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    if (session) {
      return await this.purchaseOrderModel
        .findByIdAndDelete(id, { session })
        .exec();
    }
    return await this.purchaseOrderModel.findByIdAndDelete(id).exec();
  }

  /** Non-cancelled purchase commitments ordered in a half-open period. */
  async getTotalPurchasesInRange(
    startDate: Date,
    endExclusive: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const [result] = await this.purchaseOrderModel
      .aggregate([
        {
          $match: {
            status: { $ne: "cancelled" },
            orderDate: { $gte: startDate, $lt: endExclusive },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .session(session ?? null);
    return result?.total ?? 0;
  }

  async getPurchasesByStatus(
    session?: mongoose.ClientSession,
  ): Promise<{ status: string; count: number }[]> {
    const results = await this.purchaseOrderModel
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .session(session ?? null);
    return results.map((r) => ({ status: r._id, count: r.count }));
  }

  async findRowsInRange(
    start: Date,
    endExclusive: Date,
  ): Promise<IPurchaseOrder[]> {
    return await this.purchaseOrderModel
      .find({ orderDate: { $gte: start, $lt: endExclusive } })
      .sort({ orderDate: 1 })
      .lean()
      .exec();
  }

  async getSupplierPerformance(supplierId: string): Promise<{
    totalOrders: number;
    statusCounts: Record<string, number>;
    receivedOrders: number;
    onTimeOrders: number;
    averageDelayDays: number;
    totalValue: number;
  }> {
    const rows = await this.purchaseOrderModel
      .aggregate<{
        _id: string;
        count: number;
        totalValue: number;
        onTime: number;
        delayDays: number;
        delayCount: number;
      }>([
        { $match: { supplierId: new mongoose.Types.ObjectId(supplierId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$totalAmount" },
            onTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "received"] },
                      { $ne: ["$receivedDate", null] },
                      { $ne: ["$expectedDeliveryDate", null] },
                      { $lte: ["$receivedDate", "$expectedDeliveryDate"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            delayDays: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "received"] },
                      { $ne: ["$receivedDate", null] },
                      { $ne: ["$expectedDeliveryDate", null] },
                    ],
                  },
                  {
                    $max: [
                      0,
                      {
                        $divide: [
                          { $subtract: ["$receivedDate", "$expectedDeliveryDate"] },
                          86_400_000,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
            delayCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "received"] },
                      { $ne: ["$receivedDate", null] },
                      { $ne: ["$expectedDeliveryDate", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    const statusCounts: Record<string, number> = {};
    let totalOrders = 0;
    let totalValue = 0;
    let receivedOrders = 0;
    let onTimeOrders = 0;
    let delayDays = 0;
    let delayCount = 0;

    for (const row of rows) {
      statusCounts[row._id] = row.count;
      totalOrders += row.count;
      totalValue += row.totalValue;
      if (row._id === "received") {
        receivedOrders += row.count;
        onTimeOrders += row.onTime;
        delayDays += row.delayDays;
        delayCount += row.delayCount;
      }
    }

    return {
      totalOrders,
      statusCounts,
      receivedOrders,
      onTimeOrders,
      averageDelayDays:
        delayCount > 0
          ? Math.round((delayDays / delayCount) * 10) / 10
          : 0,
      totalValue,
    };
  }

  async findRecentBySupplier(
    supplierId: string,
    limit: number,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder[]> {
    return this.purchaseOrderModel
      .find({
        supplierId,
        status: "received",
        receivedDate: { $exists: true, $ne: null },
        expectedDeliveryDate: { $exists: true, $ne: null },
      })
      .sort({ receivedDate: -1 })
      .limit(limit)
      .session(session ?? null)
      .lean()
      .exec();
  }
}
