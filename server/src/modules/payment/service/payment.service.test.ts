import { beforeEach, describe, expect, it, vi } from "vitest";

import { PaymentService } from "./payment.service.ts";

const SALE_ID = "507f1f77bcf86cd799439011";
const USER_ID = "507f1f77bcf86cd799439031";

function buildService() {
  const paymentRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findBySale: vi.fn().mockResolvedValue([]),
    summarizeBySale: vi.fn().mockResolvedValue({
      payments: 0,
      refunds: 0,
      refundReversals: 0,
    }),
  };
  const salesRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: SALE_ID,
      totalAmount: 113.87,
      paymentMethod: "CREDIT",
    }),
  };
  const service = new PaymentService(
    paymentRepo as never,
    salesRepo as never,
  );
  return { service, paymentRepo, salesRepo };
}

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports the outstanding balance from the ledger", async () => {
    const { service, paymentRepo } = buildService();
    paymentRepo.summarizeBySale.mockResolvedValue({
      payments: 50,
      refunds: 10,
      refundReversals: 5,
    });

    await expect(service.getForSale(SALE_ID)).resolves.toMatchObject({
      summary: {
        totalAmount: 113.87,
        paidAmount: 45,
        amountDue: 68.87,
      },
    });
  });

  it("records a payment within the outstanding balance", async () => {
    const { service, paymentRepo } = buildService();

    await service.addPayment(
      SALE_ID,
      { amount: 113.87, method: "CASH" },
      USER_ID,
    );

    expect(paymentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: SALE_ID,
        type: "PAYMENT",
        amount: 113.87,
        method: "CASH",
      }),
    );
  });

  it("rejects an overpayment", async () => {
    const { service } = buildService();

    await expect(
      service.addPayment(SALE_ID, { amount: 200, method: "CASH" }, USER_ID),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("records refunds and refund reversals", async () => {
    const { service, paymentRepo } = buildService();

    await service.recordRefund({
      saleId: SALE_ID as never,
      returnId: "507f1f77bcf86cd799439041" as never,
      amount: 10,
      method: "CASH",
      performedBy: USER_ID,
    });
    await service.recordRefundReversal({
      saleId: SALE_ID as never,
      returnId: "507f1f77bcf86cd799439041" as never,
      amount: 10,
      method: "CASH",
      performedBy: USER_ID,
    });

    expect(paymentRepo.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "REFUND", amount: 10 }),
      undefined,
    );
    expect(paymentRepo.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "REFUND_REVERSAL", amount: 10 }),
      undefined,
    );
  });

  it("returns 404 for an unknown sale", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.findById.mockResolvedValue(null);

    await expect(service.getForSale(SALE_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
