import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import { ReturnService, type CreateReturnDto } from "./return.service.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const SALE_ID = "507f1f77bcf86cd799439041";
const SALE_ITEM_ID = "507f1f77bcf86cd799439051";
const USER_ID = "507f1f77bcf86cd799439031";
const RETURN_ID = "507f1f77bcf86cd799439061";

const saleDate = new Date("2026-01-01T10:00:00Z");

function buildSaleItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => SALE_ITEM_ID },
    quantity: 10,
    returnedQuantity: 2,
    unitPrice: 100,
    discount: 50,
    medicineId: { toString: () => MEDICINE_ID },
    batchId: { toString: () => BATCH_ID },
    ...overrides,
  };
}

function buildDto(overrides: Partial<CreateReturnDto> = {}): CreateReturnDto {
  return {
    salesId: SALE_ID,
    returnReason: "Customer changed mind",
    returnedBy: USER_ID,
    returnDate: "2026-01-02T10:00:00Z",
    performedBy: USER_ID,
    items: [
      {
        saleItemId: SALE_ITEM_ID,
        quantity: 3,
        condition: "GOOD",
      },
    ],
    ...overrides,
  };
}

function buildApprovedReturn(
  overrides: Record<string, unknown> = {},
) {
  return {
    _id: { toString: () => RETURN_ID },
    salesId: { toString: () => SALE_ID },
    returnNumber: "RET-000001",
    status: "APPROVED",
    returnItems: [
      {
        saleItemId: { toString: () => SALE_ITEM_ID },
        medicineId: { toString: () => MEDICINE_ID },
        batchId: { toString: () => BATCH_ID },
        quantity: 3,
        condition: "GOOD",
        remarks: "Box opened",
      },
    ],
    ...overrides,
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

  const returnRepo = {
    create: vi.fn().mockResolvedValue({
      _id: { toString: () => RETURN_ID },
      status: "PENDING",
    }),
    update: vi.fn().mockResolvedValue({
      _id: { toString: () => RETURN_ID },
      status: "COMPLETED",
    }),
    findById: vi.fn().mockResolvedValue({ _id: RETURN_ID }),
    findByIdRaw: vi.fn().mockResolvedValue(buildApprovedReturn()),
    findAll: vi.fn().mockResolvedValue([]),
    transitionStatus: vi.fn().mockResolvedValue({ _id: RETURN_ID }),
    sumOutstandingBySaleItemIds: vi.fn().mockResolvedValue([]),
    hasActiveBySale: vi.fn().mockResolvedValue(false),
  };
  const saleItemRepo = {
    findBySalesId: vi.fn().mockResolvedValue([buildSaleItem()]),
    update: vi.fn().mockResolvedValue({}),
  };
  const salesRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => SALE_ID },
      saleDate,
    }),
    update: vi.fn().mockResolvedValue({}),
  };
  const inventoryService = {
    returnMedicine: vi.fn().mockResolvedValue({}),
    decreaseStock: vi.fn().mockResolvedValue({}),
  };
  const counterRepo = {
    generateReturnNumber: vi.fn().mockResolvedValue("RET-000001"),
  };
  const paymentService = {
    recordRefund: vi.fn().mockResolvedValue({}),
    recordRefundReversal: vi.fn().mockResolvedValue({}),
  };

  const service = new ReturnService(
    returnRepo as never,
    saleItemRepo as never,
    salesRepo as never,
    inventoryService as never,
    AppError,
    counterRepo as never,
    connection as never,
    undefined,
    paymentService as never,
  );

  return {
    service,
    session,
    connection,
    returnRepo,
    saleItemRepo,
    salesRepo,
    inventoryService,
    counterRepo,
    paymentService,
  };
}

describe("ReturnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReturn", () => {
    it("rejects an empty return before opening a transaction", async () => {
      const { service, connection } = buildService();

      await expect(
        service.createReturn(buildDto({ items: [] })),
      ).rejects.toMatchObject({
        message: "Return must contain at least one item",
        statusCode: 400,
      });
      expect(connection.startSession).not.toHaveBeenCalled();
    });

    it("rejects a return for an unknown sale", async () => {
      const { service, salesRepo } = buildService();
      salesRepo.findById.mockResolvedValue(null);

      await expect(service.createReturn(buildDto())).rejects.toMatchObject({
        message: "Sale not found",
        statusCode: 404,
      });
    });

    it("rejects a return date before the sale date", async () => {
      const { service } = buildService();

      await expect(
        service.createReturn(buildDto({ returnDate: "2025-12-31T10:00:00Z" })),
      ).rejects.toMatchObject({
        message: "Return date cannot be before sale date",
        statusCode: 400,
      });
    });

    it("rejects a sale item that does not belong to the sale", async () => {
      const { service } = buildService();

      await expect(
        service.createReturn(
          buildDto({
            items: [
              {
                saleItemId: "507f1f77bcf86cd799439999",
                quantity: 1,
                condition: "GOOD",
              },
            ],
          }),
        ),
      ).rejects.toMatchObject({
        message: "Invalid Sale Item",
        statusCode: 400,
      });
    });

    it("subtracts outstanding pending/approved quantities", async () => {
      const { service, returnRepo, inventoryService } = buildService();
      returnRepo.sumOutstandingBySaleItemIds.mockResolvedValue([
        { saleItemId: SALE_ITEM_ID, quantity: 6 },
      ]);

      await expect(service.createReturn(buildDto())).rejects.toMatchObject({
        message: "Only 2 items can be returned.",
        statusCode: 400,
      });
      expect(inventoryService.returnMedicine).not.toHaveBeenCalled();
    });

    it("persists a PENDING quote with VAT without moving stock", async () => {
      const { service, returnRepo, inventoryService, saleItemRepo, salesRepo } =
        buildService();

      await service.createReturn(buildDto());

      expect(inventoryService.returnMedicine).not.toHaveBeenCalled();
      expect(saleItemRepo.update).not.toHaveBeenCalled();
      expect(salesRepo.update).not.toHaveBeenCalled();
      expect(returnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          returnNumber: "RET-000001",
          status: "PENDING",
          // 3 * 100 = 300, line discount share 15 => net 285, VAT 37.05
          refundAmount: 322.05,
          returnItems: [
            expect.objectContaining({
              saleItemId: expect.anything(),
              quantity: 3,
              unitPrice: 100,
              discount: 15,
              VAT: 37.05,
              refundAmount: 322.05,
              condition: "GOOD",
            }),
          ],
        }),
        expect.anything(),
      );
    });

    it("apportions an invoice-level discount into the refund", async () => {
      const { service, returnRepo, saleItemRepo, salesRepo } = buildService();
      const otherItemId = "507f1f77bcf86cd799439052";

      saleItemRepo.findBySalesId.mockResolvedValue([
        buildSaleItem({
          quantity: 3,
          returnedQuantity: 0,
          unitPrice: 100,
          discount: 0,
        }),
        buildSaleItem({
          _id: { toString: () => otherItemId },
          quantity: 2,
          returnedQuantity: 0,
          unitPrice: 50,
          discount: 0,
        }),
      ]);
      // Sale: subtotal 400, invoice discount 25, taxable 375, VAT 48.75,
      // total 423.75. The two refunds below sum to exactly 423.75.
      salesRepo.findById.mockResolvedValue({
        _id: { toString: () => SALE_ID },
        saleDate,
        discount: 25,
      });

      await service.createReturn(
        buildDto({
          items: [
            { saleItemId: SALE_ITEM_ID, quantity: 3, condition: "GOOD" },
            { saleItemId: otherItemId, quantity: 2, condition: "GOOD" },
          ],
        }),
      );

      const payload = returnRepo.create.mock.calls[0]?.[0] as {
        refundAmount: number;
        returnItems: Array<{
          discount: number;
          VAT: number;
          refundAmount: number;
        }>;
      };

      expect(payload.returnItems[0]).toMatchObject({
        discount: 18.75,
        VAT: 36.56,
        refundAmount: 317.81,
      });
      expect(payload.returnItems[1]).toMatchObject({
        discount: 6.25,
        VAT: 12.19,
        refundAmount: 105.94,
      });
      expect(payload.refundAmount).toBe(423.75);
    });

    it("persists per-line remarks", async () => {
      const { service, returnRepo } = buildService();

      await service.createReturn(
        buildDto({
          items: [
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 1,
              condition: "GOOD",
              remarks: "Seal intact",
            },
          ],
        }),
      );

      expect(returnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          returnItems: [
            expect.objectContaining({ remarks: "Seal intact" }),
          ],
        }),
        expect.anything(),
      );
    });

    it("counts multiple condition lines cumulatively against the same item", async () => {
      const { service } = buildService();

      await expect(
        service.createReturn(
          buildDto({
            items: [
              {
                saleItemId: SALE_ITEM_ID,
                quantity: 5,
                condition: "GOOD",
              },
              {
                saleItemId: SALE_ITEM_ID,
                quantity: 5,
                condition: "DAMAGED",
              },
            ],
          }),
        ),
      ).rejects.toMatchObject({
        message: "Only 3 items can be returned.",
        statusCode: 400,
      });
    });

    it("merges duplicate lines for the same condition only", async () => {
      const { service, returnRepo } = buildService();

      await service.createReturn(
        buildDto({
          items: [
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 1,
              condition: "GOOD",
            },
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 2,
              condition: "GOOD",
            },
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 1,
              condition: "DAMAGED",
            },
          ],
        }),
      );

      const payload = returnRepo.create.mock.calls[0]?.[0] as {
        returnItems: Array<{ quantity: number; condition: string }>;
      };

      expect(payload.returnItems).toHaveLength(2);
      expect(payload.returnItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ quantity: 3, condition: "GOOD" }),
          expect.objectContaining({ quantity: 1, condition: "DAMAGED" }),
        ]),
      );
    });

    it("ends the session after creation and on failure", async () => {
      const success = buildService();
      await success.service.createReturn(buildDto());
      expect(success.session.endSession).toHaveBeenCalledTimes(1);

      const failure = buildService();
      failure.salesRepo.findById.mockResolvedValue(null);
      await expect(failure.service.createReturn(buildDto())).rejects.toThrow(
        "Sale not found",
      );
      expect(failure.session.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("status transitions", () => {
    it("approves, rejects, and cancels pending returns", async () => {
      const { service, returnRepo } = buildService();

      await service.approveReturn(RETURN_ID);
      expect(returnRepo.transitionStatus).toHaveBeenCalledWith(
        RETURN_ID,
        "PENDING",
        "APPROVED",
      );

      await service.rejectReturn(RETURN_ID);
      expect(returnRepo.transitionStatus).toHaveBeenCalledWith(
        RETURN_ID,
        "PENDING",
        "REJECTED",
      );

      await service.cancelReturn(RETURN_ID);
      expect(returnRepo.transitionStatus).toHaveBeenCalledWith(
        RETURN_ID,
        "PENDING",
        "CANCELLED",
      );
    });

    it("rejects an invalid transition with 409", async () => {
      const { service, returnRepo } = buildService();
      returnRepo.transitionStatus.mockResolvedValue(null);
      returnRepo.findByIdRaw.mockResolvedValue({
        _id: RETURN_ID,
        status: "COMPLETED",
      });

      await expect(service.approveReturn(RETURN_ID)).rejects.toMatchObject({
        message: "Only pending returns can be approved",
        statusCode: 409,
      });
    });

    it("returns 404 when the return does not exist", async () => {
      const { service, returnRepo } = buildService();
      returnRepo.transitionStatus.mockResolvedValue(null);
      returnRepo.findByIdRaw.mockResolvedValue(null);

      await expect(service.rejectReturn(RETURN_ID)).rejects.toMatchObject({
        message: "Return not found",
        statusCode: 404,
      });
    });

    it("only updates the reason while pending", async () => {
      const { service, returnRepo } = buildService();
      returnRepo.findByIdRaw.mockResolvedValue({
        _id: RETURN_ID,
        status: "PENDING",
      });

      await service.updateReturn(RETURN_ID, { returnReason: "Wrong item" });
      expect(returnRepo.update).toHaveBeenCalledWith(RETURN_ID, {
        returnReason: "Wrong item",
      });
    });

    it("locks the reason after approval", async () => {
      const { service, returnRepo } = buildService();
      returnRepo.findByIdRaw.mockResolvedValue({
        _id: RETURN_ID,
        status: "APPROVED",
      });

      await expect(
        service.updateReturn(RETURN_ID, { returnReason: "Wrong item" }),
      ).rejects.toMatchObject({
        message: "Only pending returns can be updated",
        statusCode: 409,
      });
      expect(returnRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("completeReturn", () => {
    it("applies stock, refund, sale item, and sale status in one transaction", async () => {
      const { service, returnRepo, saleItemRepo, salesRepo, inventoryService } =
        buildService();

      const result = await service.completeReturn(RETURN_ID, USER_ID);

      expect(inventoryService.returnMedicine).toHaveBeenCalledTimes(1);
      expect(inventoryService.returnMedicine).toHaveBeenCalledWith(
        MEDICINE_ID,
        BATCH_ID,
        3,
        "GOOD",
        expect.objectContaining({
          referenceId: RETURN_ID,
          referenceType: "SALES_RETURN",
          movementType: "RETURN",
          performedBy: USER_ID,
          remarks: "Return RET-000001: Box opened",
        }),
        expect.anything(),
      );

      expect(saleItemRepo.update).toHaveBeenCalledWith(
        SALE_ITEM_ID,
        { returnedQuantity: 5 },
        expect.anything(),
      );

      expect(returnRepo.update).toHaveBeenCalledWith(
        RETURN_ID,
        expect.objectContaining({
          status: "COMPLETED",
          refundAmount: 322.05,
          returnItems: [
            expect.objectContaining({
              quantity: 3,
              discount: 15,
              VAT: 37.05,
              refundAmount: 322.05,
              condition: "GOOD",
              remarks: "Box opened",
            }),
          ],
        }),
        expect.anything(),
      );

      expect(salesRepo.update).toHaveBeenCalledWith(
        SALE_ID,
        { status: "PARTIALLY_RETURNED" },
        expect.anything(),
      );
      expect(result).toMatchObject({ status: "COMPLETED" });
    });

    it("writes one movement per line and keeps conditions separate", async () => {
      const { service, returnRepo, inventoryService, saleItemRepo } =
        buildService();
      returnRepo.findByIdRaw.mockResolvedValue(
        buildApprovedReturn({
          returnItems: [
            {
              saleItemId: { toString: () => SALE_ITEM_ID },
              medicineId: { toString: () => MEDICINE_ID },
              batchId: { toString: () => BATCH_ID },
              quantity: 1,
              condition: "GOOD",
            },
            {
              saleItemId: { toString: () => SALE_ITEM_ID },
              medicineId: { toString: () => MEDICINE_ID },
              batchId: { toString: () => BATCH_ID },
              quantity: 2,
              condition: "DAMAGED",
            },
          ],
        }),
      );

      await service.completeReturn(RETURN_ID, USER_ID);

      expect(inventoryService.returnMedicine).toHaveBeenCalledTimes(2);
      expect(inventoryService.returnMedicine).toHaveBeenCalledWith(
        MEDICINE_ID,
        BATCH_ID,
        2,
        "DAMAGED",
        expect.anything(),
        expect.anything(),
      );
      // 2 already returned + 1 GOOD + 2 DAMAGED = 5; the second write
      // accumulates on top of the first.
      expect(saleItemRepo.update).toHaveBeenCalledTimes(2);
      expect(saleItemRepo.update).toHaveBeenLastCalledWith(
        SALE_ITEM_ID,
        { returnedQuantity: 5 },
        expect.anything(),
      );
    });

    it("counts multiple condition lines cumulatively at completion", async () => {
      const { service, returnRepo, salesRepo, inventoryService } =
        buildService();
      returnRepo.findByIdRaw.mockResolvedValue(
        buildApprovedReturn({
          returnItems: [
            {
              saleItemId: { toString: () => SALE_ITEM_ID },
              medicineId: { toString: () => MEDICINE_ID },
              batchId: { toString: () => BATCH_ID },
              quantity: 5,
              condition: "GOOD",
            },
            {
              saleItemId: { toString: () => SALE_ITEM_ID },
              medicineId: { toString: () => MEDICINE_ID },
              batchId: { toString: () => BATCH_ID },
              quantity: 5,
              condition: "DAMAGED",
            },
          ],
        }),
      );

      await expect(
        service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({
        message: "Only 3 items can be returned.",
        statusCode: 400,
      });
      // The first line was attempted; the transaction would roll it back.
      expect(inventoryService.returnMedicine).toHaveBeenCalledTimes(1);
      expect(returnRepo.update).not.toHaveBeenCalled();
      expect(salesRepo.update).not.toHaveBeenCalled();
    });

    it("marks the sale fully returned when every unit is back", async () => {
      const { service, saleItemRepo, salesRepo } = buildService();
      saleItemRepo.findBySalesId.mockResolvedValue([
        buildSaleItem({ returnedQuantity: 7 }),
      ]);

      await service.completeReturn(RETURN_ID, USER_ID);

      expect(salesRepo.update).toHaveBeenCalledWith(
        SALE_ID,
        { status: "RETURNED" },
        expect.anything(),
      );
    });

    it("requires an APPROVED return", async () => {
      const { service, returnRepo, inventoryService } = buildService();
      returnRepo.findByIdRaw.mockResolvedValue(
        buildApprovedReturn({ status: "PENDING" }),
      );

      await expect(
        service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({
        message: "Only approved returns can be completed",
        statusCode: 409,
      });
      expect(inventoryService.returnMedicine).not.toHaveBeenCalled();
    });

    it("re-validates quantities before touching stock", async () => {
      const { service, saleItemRepo, inventoryService } = buildService();
      saleItemRepo.findBySalesId.mockResolvedValue([
        buildSaleItem({ returnedQuantity: 8 }),
      ]);

      await expect(
        service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({
        message: "Only 2 items can be returned.",
        statusCode: 400,
      });
      expect(inventoryService.returnMedicine).not.toHaveBeenCalled();
    });

    it("returns 404 for an unknown return or sale", async () => {
      const unknownReturn = buildService();
      unknownReturn.returnRepo.findByIdRaw.mockResolvedValue(null);
      await expect(
        unknownReturn.service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({ message: "Return not found", statusCode: 404 });

      const unknownSale = buildService();
      unknownSale.salesRepo.findById.mockResolvedValue(null);
      await expect(
        unknownSale.service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({ message: "Sale not found", statusCode: 404 });
    });

    it("requires an authenticated performer", async () => {
      const { service, connection } = buildService();

      await expect(
        service.completeReturn(RETURN_ID, ""),
      ).rejects.toMatchObject({ statusCode: 401 });
      expect(connection.startSession).not.toHaveBeenCalled();
    });

    it("ends the session after completion and on failure", async () => {
      const success = buildService();
      await success.service.completeReturn(RETURN_ID, USER_ID);
      expect(success.session.endSession).toHaveBeenCalledTimes(1);

      const failure = buildService();
      failure.returnRepo.findByIdRaw.mockResolvedValue(null);
      await expect(
        failure.service.completeReturn(RETURN_ID, USER_ID),
      ).rejects.toThrow("Return not found");
      expect(failure.session.endSession).toHaveBeenCalledTimes(1);
    });

    it("records the refund in the payment ledger", async () => {
      const { service, paymentService } = buildService();

      await service.completeReturn(RETURN_ID, USER_ID);

      expect(paymentService.recordRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          performedBy: USER_ID,
          returnId: expect.anything(),
        }),
        expect.anything(),
      );
    });
  });

  describe("restocking fee", () => {
    it("deducts the fee before VAT when quoting a GOOD return", async () => {
      const { service, returnRepo } = buildService();

      await service.createReturn(
        buildDto({
          items: [
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 3,
              condition: "GOOD",
              restockingFee: 10,
            },
          ],
        }),
      );

      expect(returnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          refundAmount: 310.75,
          returnItems: [
            expect.objectContaining({
              restockingFee: 10,
              VAT: 35.75,
              refundAmount: 310.75,
            }),
          ],
        }),
        expect.anything(),
      );
    });

    it("rejects a fee on a write-off line", async () => {
      const { service } = buildService();

      await expect(
        service.createReturn(
          buildDto({
            items: [
              {
                saleItemId: SALE_ITEM_ID,
                quantity: 1,
                condition: "DAMAGED",
                restockingFee: 5,
              },
            ],
          }),
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("reverseReturn", () => {
    it("deducts GOOD stock, restores returned quantity, and reverses the refund", async () => {
      const { service, returnRepo, saleItemRepo, inventoryService, paymentService } =
        buildService();
      returnRepo.findByIdRaw.mockResolvedValue(
        buildApprovedReturn({
          status: "COMPLETED",
          reversedAt: null,
          refundAmount: 322.05,
        }),
      );
      saleItemRepo.findBySalesId.mockResolvedValue([
        buildSaleItem({ returnedQuantity: 5 }),
      ]);

      await service.reverseReturn(RETURN_ID, USER_ID, "Wrong return");

      expect(inventoryService.decreaseStock).toHaveBeenCalledWith(
        MEDICINE_ID,
        3,
        expect.objectContaining({
          movementType: "ADJUSTMENT",
          referenceType: "SALES_RETURN",
        }),
        expect.anything(),
      );
      expect(saleItemRepo.update).toHaveBeenCalledWith(
        SALE_ITEM_ID,
        { returnedQuantity: 2 },
        expect.anything(),
      );
      expect(returnRepo.update).toHaveBeenCalledWith(
        RETURN_ID,
        expect.objectContaining({
          status: "REVERSED",
          reversalReason: "Wrong return",
        }),
        expect.anything(),
      );
      expect(paymentService.recordRefundReversal).toHaveBeenCalled();
    });

    it("rejects reversing a non-completed return", async () => {
      const { service, connection } = buildService();

      await expect(
        service.reverseReturn(RETURN_ID, USER_ID),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(connection.startSession).toHaveBeenCalled();
    });
  });
});
