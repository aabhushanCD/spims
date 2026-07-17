import mongoose from "mongoose";
import { Counter } from "../model/counter.model.ts";
import { COUNTERS } from "../constants/counter.constants.ts";

export class CounterRepository {
  /**
   * Get next sequence
   */
  private async getNextSequence(
    counterName: string,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { sequence: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session,
      },
    ).lean();

    if (!counter) {
      throw new Error(`Failed to generate sequence for ${counterName}`);
    }

    return counter.sequence;
  }

  /**
   * Generic generator
   */
  private async generateNumber(
    prefix: string,
    counterName: string,
    session?: mongoose.ClientSession,
  ): Promise<string> {
    const sequence = await this.getNextSequence(counterName, session);

    return `${prefix}-${sequence.toString().padStart(6, "0")}`;
  }

  /**
   * Invoice Number
   * INV-000001
   */
  async generateInvoiceNumber(
    session?: mongoose.ClientSession,
  ): Promise<string> {
    return this.generateNumber("INV", COUNTERS.INVOICE, session);
  }

  /**
   * Purchase Order Number
   * PO-000001
   */
  async generatePurchaseOrderNumber(
    session?: mongoose.ClientSession,
  ): Promise<string> {
    return this.generateNumber("PO", COUNTERS.PURCHASE_ORDER, session);
  }

  /**
   * Return Number
   * RET-000001
   */
  async generateReturnNumber(
    session?: mongoose.ClientSession,
  ): Promise<string> {
    return this.generateNumber("RET", COUNTERS.RETURN, session);
  }

  /**
   * Stock Adjustment Number
   * ADJ-000001
   */
  async generateStockAdjustmentNumber(
    session?: mongoose.ClientSession,
  ): Promise<string> {
    return this.generateNumber("ADJ", COUNTERS.STOCK_ADJUSTMENT, session);
  }
}
