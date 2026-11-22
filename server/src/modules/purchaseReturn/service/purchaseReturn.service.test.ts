import { beforeEach, describe, expect, it, vi } from "vitest";

import { PurchaseReturnService } from "./purchaseReturn.service.ts";
import { AppError } from "../../../shared/error.ts";

const PO_ID = "507f1f77bcf86cd799439011";
const SUPPLIER_ID = "507f1f77bcf86cd799439021";
const BATCH_ID = "507f1f77bcf86cd799439031";
const MEDICINE_ID = "507f1f77bcf86cd799439041";
const USER_ID = "507f1f77bcf86cd799439051";
const RETURN_ID = "507f1f77bcf86cd799439061";

function buildService() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = {
    startSession: vi.fn().mockResolvedValue(session),
  };
  const returnRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findByIdRaw: vi.fn(),
    findById: vi.fn(),
    findPage: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (_id, data) => data),
    transition: vi.fn(),
  };
  const purchaseOrderRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => PO_ID },
      supplierId: { toString: () => SUPPLIER_ID },
      status: "received",
    }),
  };
  const batchRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => BATCH_ID },
      batchNumber: "B-1",
      medicineId: { toString: () => MEDICINE_ID },
      purchaseOrderId: { toString: () => PO_ID },
      quantityRemaining: 10,
      purchasePrice: 12.5,
    }),
  };
  const inventoryService = {
    decreaseStock: vi.fn().mockResolvedValue({}),
  };
  const counterRepo = {
    generatePurchaseReturnNumber: vi.fn().mockResolvedValue("PRET-000001"),
  };

  const service = new PurchaseReturnService(
    returnRepo as never,
    purchaseOrderRepo as never,
    batchRepo as never,
    inventoryService as never,
    counterRepo as never,
    AppError,
    connection as never,
  );

  return {
    service,
    session,
    connection,
    returnRepo,
    purchaseOrderRepo,
    batchRepo,
    inventoryService,
    counterRepo,
  };
}

function dto() {
  return {
    purchaseOrderId: PO_ID,
    returnReason: "Damaged supplier stock",
    returnDate: new Date("2026-02-01T00:00:00Z"),
    items: [{ batchId: BATCH_ID, quantity: 2 }],
  };
}

describe("PurchaseReturnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a pending return with a supplier credit and unit cost", async () => {
    const { service, returnRepo } = buildService();

    await service.create(dto(), USER_ID);

    expect(returnRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseOrderId: expect.anything(),
        supplierId: expect.anything(),
        status: "PENDING",
        returnNumber: "PRET-000001",
        refundAmount: 25,
        items: [
          expect.objectContaining({
            batchId: expect.anything(),
            quantity: 2,
            unitCost: 12.5,
            refundAmount: 25,
          }),
        ],
      }),
      expect.anything(),
    );
  });

  it("rejects a return for an order that was not received", async () => {
    const { service, purchaseOrderRepo, connection } = buildService();
    purchaseOrderRepo.findById.mockResolvedValue({
      _id: PO_ID,
      supplierId: SUPPLIER_ID,
      status: "approved",
    });

    await expect(service.create(dto(), USER_ID)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(connection.startSession).toHaveBeenCalled();
  });

  it("rejects a quantity above the batch remainder", async () => {
    const { service, batchRepo } = buildService();
    batchRepo.findById.mockResolvedValue({
      _id: BATCH_ID,
      batchNumber: "B-1",
      medicineId: MEDICINE_ID,
      purchaseOrderId: PO_ID,
      quantityRemaining: 1,
      purchasePrice: 12.5,
    });

    await expect(service.create(dto(), USER_ID)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("deducts stock and completes an approved return", async () => {
    const { service, returnRepo, inventoryService } = buildService();
    returnRepo.findByIdRaw.mockResolvedValue({
      _id: { toString: () => RETURN_ID },
      returnNumber: "PRET-000001",
      status: "APPROVED",
      items: [
        {
          batchId: { toString: () => BATCH_ID },
          medicineId: { toString: () => MEDICINE_ID },
          quantity: 2,
        },
      ],
    });

    await service.complete(RETURN_ID, USER_ID);

    expect(inventoryService.decreaseStock).toHaveBeenCalledWith(
      MEDICINE_ID,
      2,
      expect.objectContaining({
        movementType: "PURCHASE_RETURN",
        referenceType: "PURCHASE_RETURN",
      }),
      expect.anything(),
    );
    expect(returnRepo.update).toHaveBeenCalledWith(
      RETURN_ID,
      expect.objectContaining({ status: "COMPLETED" }),
      expect.anything(),
    );
  });

  it("rejects completion before approval", async () => {
    const { service, returnRepo } = buildService();
    returnRepo.findByIdRaw.mockResolvedValue({
      _id: RETURN_ID,
      status: "PENDING",
      items: [],
    });

    await expect(service.complete(RETURN_ID, USER_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
