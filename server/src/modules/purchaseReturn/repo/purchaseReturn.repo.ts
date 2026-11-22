import type mongoose from "mongoose";

import type PurchaseReturn from "../model/purchaseReturn.model.ts";
import type { IPurchaseReturn } from "../model/purchaseReturn.model.ts";
import type { PurchaseReturnListQuery } from "../schema/purchaseReturn.schema.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";

export class PurchaseReturnRepo {
  constructor(private readonly model: typeof PurchaseReturn) {}

  async create(
    data: Partial<IPurchaseReturn>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseReturn> {
    const doc = new this.model(data);
    return session ? await doc.save({ session }) : await doc.save();
  }

  async findById(id: string): Promise<IPurchaseReturn | null> {
    return await this.model
      .findById(id)
      .populate("supplierId", "companyName")
      .populate("purchaseOrderId", "invoiceNumber status")
      .lean()
      .exec();
  }

  async findByIdRaw(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseReturn | null> {
    const query = this.model.findById(id).lean();
    if (session) {
      query.session(session);
    }
    return await query.exec();
  }

  async findPage(
    filters: {
      status?: PurchaseReturnListQuery["status"];
      supplierId?: string;
      purchaseOrderId?: string;
      from?: Date;
      to?: Date;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IPurchaseReturn[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.status) {
      conditions.push({ status: filters.status });
    }
    if (filters.supplierId) {
      conditions.push({ supplierId: filters.supplierId });
    }
    if (filters.purchaseOrderId) {
      conditions.push({ purchaseOrderId: filters.purchaseOrderId });
    }
    if (filters.from || filters.to) {
      conditions.push({
        returnDate: {
          ...(filters.from ? { $gte: filters.from } : {}),
          ...(filters.to ? { $lte: filters.to } : {}),
        },
      });
    }
    const cursorClause = cursorFilter("returnDate", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};

    return await this.model
      .find(query)
      .populate("supplierId", "companyName")
      .populate("purchaseOrderId", "invoiceNumber status")
      .sort({ returnDate: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async update(
    id: string,
    data: Partial<IPurchaseReturn>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseReturn | null> {
    const query = this.model.findByIdAndUpdate(id, data, { new: true });
    if (session) {
      query.session(session);
    }
    return await query.lean().exec();
  }

  async transition(
    id: string,
    from: IPurchaseReturn["status"],
    to: IPurchaseReturn["status"],
  ): Promise<IPurchaseReturn | null> {
    return await this.model
      .findOneAndUpdate({ _id: id, status: from }, { status: to }, { new: true })
      .lean()
      .exec();
  }
}
