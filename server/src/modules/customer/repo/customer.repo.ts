import type { UpdateCustomerDto } from "../schema/customer.schema.ts";
import type { ICustomer } from "../model/customer.model.ts";
import type Customer from "../model/customer.model.ts";
import mongoose from "mongoose";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";

export class CustomerRepo {
  constructor(private readonly customerModel: typeof Customer) {}

  async create(
    data: Partial<ICustomer>,
    session?: mongoose.ClientSession,
  ): Promise<ICustomer> {
    const customer = new this.customerModel(data);
    return session ? await customer.save({ session }) : await customer.save();
  }

  async findById(id: string): Promise<ICustomer | null> {
    return await this.customerModel.findById(id).lean().exec();
  }

  async findPage(
    filters: { search?: string; isActive?: boolean },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<ICustomer[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.isActive !== undefined) {
      conditions.push({ isActive: filters.isActive });
    }
    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search), "i");
      conditions.push({
        $or: [{ name: regex }, { phone: regex }, { email: regex }],
      });
    }
    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};
    return await this.customerModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async update(
    id: string,
    data: UpdateCustomerDto,
  ): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const update: Record<string, string | boolean | null> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.phone !== undefined) update.phone = data.phone ?? null;
    if (data.email !== undefined) update.email = data.email ?? null;
    if (data.address !== undefined) update.address = data.address ?? null;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    return await this.customerModel
      .findByIdAndUpdate(new mongoose.Types.ObjectId(id), update, {
        new: true,
      })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<ICustomer | null> {
    return await this.customerModel.findByIdAndDelete(id).lean().exec();
  }
}
