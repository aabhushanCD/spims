import type { ISalesReturn } from "../model/return.model.ts";
import type Return from "../model/return.model.ts";

export class ReturnRepo {
  constructor(private readonly returnModel: typeof Return) {}

  async create(returnData: Partial<ISalesReturn>): Promise<ISalesReturn> {
    const salesReturn = new this.returnModel(returnData);
    return await salesReturn.save();
  }

  async findById(returnId: string): Promise<ISalesReturn | null> {
    return this.returnModel.findById(returnId).lean().exec();
  }

  async findAll(): Promise<ISalesReturn[]> {
    return this.returnModel.find().lean().exec();
  }

  async update(
    returnId: string,
    updateData: Partial<ISalesReturn>,
  ): Promise<ISalesReturn | null> {
    return this.returnModel
      .findByIdAndUpdate(returnId, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(returnId: string): Promise<ISalesReturn | null> {
    return this.returnModel.findByIdAndDelete(returnId).lean().exec();
  }
}
