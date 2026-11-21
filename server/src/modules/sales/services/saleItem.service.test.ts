import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import { SaleItemService } from "./saleItem.service.ts";

const SALE_ID = "507f1f77bcf86cd799439041";
const ITEM_ID = "507f1f77bcf86cd799439051";
const OTHER_ITEM_ID = "507f1f77bcf86cd799439052";

function buildItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => ITEM_ID },
    salesId: { toString: () => SALE_ID },
    quantity: 4,
    returnedQuantity: 0,
    unitPrice: 100,
    discount: 40,
    totalPrice: 360,
    ...overrides,
  };
}

function buildOtherItem() {
  return {
    _id: { toString: () => OTHER_ITEM_ID },
    salesId: { toString: () => SALE_ID },
    quantity: 2,
    returnedQuantity: 0,
    unitPrice: 50,
    discount: 0,
    totalPrice: 100,
  };
}

function buildService() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = {
    startSession: vi.fn().mockResolvedValue(session),
  };

  const saleItemRepo = {
    findById: vi.fn().mockResolvedValue(buildItem()),
    findBySalesId: vi
      .fn()
      .mockResolvedValue([buildItem(), buildOtherItem()]),
    update: vi.fn().mockResolvedValue(buildItem()),
  };
  const salesRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => SALE_ID },
      // 40 line discount + 10 invoice discount
      discount: 50,
    }),
    update: vi.fn().mockResolvedValue({}),
  };

  const service = new SaleItemService(
    saleItemRepo as never,
    salesRepo as never,
    AppError,
    connection as never,
  );

  return { service, session, connection, saleItemRepo, salesRepo };
}

describe("SaleItemService.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recomputes the line total and the parent sale totals", async () => {
    const { service, saleItemRepo, salesRepo } = buildService();
    saleItemRepo.update.mockResolvedValue(
      buildItem({ unitPrice: 125, totalPrice: 460 }),
    );

    await service.update(ITEM_ID, { unitPrice: 125 });

    expect(saleItemRepo.update).toHaveBeenCalledWith(
      ITEM_ID,
      {
        unitPrice: 125,
        discount: 40,
        totalPrice: 460,
      },
      expect.anything(),
    );
    // subtotal 600, line discounts 40, preserved invoice discount 10
    expect(salesRepo.update).toHaveBeenCalledWith(
      SALE_ID,
      {
        subTotal: 600,
        discount: 50,
        VAT: 71.5,
        totalAmount: 621.5,
      },
      expect.anything(),
    );
  });

  it("preserves the invoice discount when the line discount changes", async () => {
    const { service, salesRepo } = buildService();

    await service.update(ITEM_ID, { discount: 60 });

    // subtotal 500, line discount 60, invoice discount 10
    expect(salesRepo.update).toHaveBeenCalledWith(
      SALE_ID,
      {
        subTotal: 500,
        discount: 70,
        VAT: 55.9,
        totalAmount: 485.9,
      },
      expect.anything(),
    );
  });

  it("rejects a correction on a line that already has returns", async () => {
    const { service, saleItemRepo } = buildService();
    saleItemRepo.findById.mockResolvedValue(
      buildItem({ returnedQuantity: 1 }),
    );

    await expect(
      service.update(ITEM_ID, { unitPrice: 125 }),
    ).rejects.toMatchObject({
      message: "Cannot correct a sale item after it has been returned",
      statusCode: 409,
    });
    expect(saleItemRepo.update).not.toHaveBeenCalled();
  });

  it("rejects a discount larger than the corrected line total", async () => {
    const { service } = buildService();

    await expect(
      service.update(ITEM_ID, { discount: 500 }),
    ).rejects.toMatchObject({
      message: "Discount cannot exceed the corrected line total",
      statusCode: 400,
    });
  });

  it("rejects a correction that would make the sale total negative", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.findById.mockResolvedValue({
      _id: { toString: () => SALE_ID },
      discount: 1000,
    });

    await expect(
      service.update(ITEM_ID, { unitPrice: 10 }),
    ).rejects.toMatchObject({
      message: "Correction would make the sale total negative",
      statusCode: 400,
    });
  });

  it("returns 404 for an unknown sale item", async () => {
    const { service, saleItemRepo } = buildService();
    saleItemRepo.findById.mockResolvedValue(null);

    await expect(
      service.update(ITEM_ID, { unitPrice: 125 }),
    ).rejects.toMatchObject({
      message: "Sale item not found",
      statusCode: 404,
    });
  });

  it("returns 404 when the parent sale is missing", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.findById.mockResolvedValue(null);

    await expect(
      service.update(ITEM_ID, { unitPrice: 125 }),
    ).rejects.toMatchObject({
      message: "Sale not found",
      statusCode: 404,
    });
  });

  it("ends the session on success and on failure", async () => {
    const success = buildService();
    await success.service.update(ITEM_ID, { unitPrice: 125 });
    expect(success.session.endSession).toHaveBeenCalledTimes(1);

    const failure = buildService();
    failure.saleItemRepo.findById.mockResolvedValue(null);
    await expect(
      failure.service.update(ITEM_ID, { unitPrice: 125 }),
    ).rejects.toThrow("Sale item not found");
    expect(failure.session.endSession).toHaveBeenCalledTimes(1);
  });
});
