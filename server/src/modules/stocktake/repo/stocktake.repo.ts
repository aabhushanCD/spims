import type mongoose from "mongoose";

import type Stocktake from "../model/stocktake.model.ts";
import type { IStocktake } from "../model/stocktake.model.ts";
import type { StocktakeListQuery } from "../schema/stocktake.schema.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";

export class StocktakeRepo {
  constructor(private readonly model: typeof Stocktake) {}

  async create(
    data: Partial<IStocktake>,
    session?: mongoose.ClientSession,
  ): Promise<IStocktake> {
    const doc = new this.model(data);
    return session ? await doc.save({ session }) : await doc.save();
  }

  async findById(id: string): Promise<IStocktake | null> {
    return await this.model
      .findById(id)
      .populate("startedBy", "name")
      .populate("completedBy", "name")
      .lean()
      .exec();
  }

  async findByIdRaw(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IStocktake | null> {
    const query = this.model.findById(id).lean();
    if (session) {
      query.session(session);
    }
    return await query.exec();
  }

  async findPage(
    filters: { status?: StocktakeListQuery["status"] },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IStocktake[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.status) {
      conditions.push({ status: filters.status });
    }
    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    return await this.model
      .find(conditions.length ? { $and: conditions } : {})
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async update(
    id: string,
    data: Partial<IStocktake>,
    session?: mongoose.ClientSession,
  ): Promise<IStocktake | null> {
    const query = this.model.findByIdAndUpdate(id, data, { new: true });
    if (session) {
      query.session(session);
    }
    return await query.lean().exec();
  }
}
