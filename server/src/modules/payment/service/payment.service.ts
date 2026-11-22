import { Types } from "mongoose";
import type mongoose from "mongoose";

import { roundCurrency } from "../../../shared/finance/money.ts";
import { AppError } from "../../../shared/error.ts";
import type { SalesRepo } from "../../sales/repo/sales.repo.ts";
import type { PaymentRepo } from "../repo/payment.repo.ts";
import type { IPayment, PaymentType } from "../model/payment.model.ts";

export interface SalePaymentSummary {
  totalAmount: number;
  paidAmount: number;
  amountDue: number;
}

export interface PaymentInput {
  amount: number;
  method: string;
  reference?: string | undefined;
  idempotencyKey?: string | undefined;
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly salesRepo: SalesRepo,
  ) {}

  private async summary(saleId: string, totalAmount: number) {
    const totals = await this.paymentRepo.summarizeBySale(saleId);
    const paidAmount = roundCurrency(
      totals.payments - totals.refunds + totals.refundReversals,
    );
    return {
      totalAmount: roundCurrency(totalAmount),
      paidAmount,
      amountDue: Math.max(0, roundCurrency(totalAmount - paidAmount)),
    };
  }

  async getForSale(saleId: string): Promise<{
    items: IPayment[];
    summary: SalePaymentSummary;
  }> {
    const sale = await this.salesRepo.findById(saleId);
    if (!sale) {
      throw AppError.notFound("Sale not found");
    }
    const items = await this.paymentRepo.findBySale(saleId);
    return {
      items,
      summary: await this.summary(saleId, sale.totalAmount),
    };
  }

  async addPayment(
    saleId: string,
    input: PaymentInput,
    performedBy: string,
  ): Promise<IPayment> {
    const sale = await this.salesRepo.findById(saleId);
    if (!sale) {
      throw AppError.notFound("Sale not found");
    }

    const { amountDue } = await this.summary(saleId, sale.totalAmount);
    if (input.amount > amountDue) {
      throw AppError.badRequest(
        `Payment exceeds the outstanding amount of ${amountDue}`,
      );
    }

    return await this.paymentRepo.create({
      saleId: sale._id,
      type: "PAYMENT",
      method: input.method,
      amount: roundCurrency(input.amount),
      reference: input.reference ?? null,
      performedBy: new Types.ObjectId(performedBy),
      paidAt: new Date(),
      ...(input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : {}),
    });
  }

  async recordSalePayment(
    input: {
      saleId: IPayment["saleId"];
      amount: number;
      method: string;
      performedBy: string;
      paidAt: Date;
    },
    session?: mongoose.ClientSession,
  ): Promise<IPayment> {
    return await this.paymentRepo.create(
      {
        saleId: input.saleId,
        type: "PAYMENT",
        method: input.method,
        amount: roundCurrency(input.amount),
        performedBy: new Types.ObjectId(input.performedBy),
        paidAt: input.paidAt,
      },
      session,
    );
  }

  async recordRefund(
    input: {
      saleId: IPayment["saleId"];
      returnId: IPayment["returnId"];
      amount: number;
      method: string;
      performedBy: string;
    },
    session?: mongoose.ClientSession,
  ): Promise<IPayment> {
    return await this.recordByType("REFUND", input, session);
  }

  async recordRefundReversal(
    input: {
      saleId: IPayment["saleId"];
      returnId: IPayment["returnId"];
      amount: number;
      method: string;
      performedBy: string;
    },
    session?: mongoose.ClientSession,
  ): Promise<IPayment> {
    return await this.recordByType("REFUND_REVERSAL", input, session);
  }

  private async recordByType(
    type: PaymentType,
    input: {
      saleId: IPayment["saleId"];
      returnId: IPayment["returnId"];
      amount: number;
      method: string;
      performedBy: string;
    },
    session?: mongoose.ClientSession,
  ): Promise<IPayment> {
    return await this.paymentRepo.create(
      {
        saleId: input.saleId,
        returnId: input.returnId ?? null,
        type,
        method: input.method,
        amount: roundCurrency(input.amount),
        performedBy: new Types.ObjectId(input.performedBy),
        paidAt: new Date(),
      },
      session,
    );
  }
}
