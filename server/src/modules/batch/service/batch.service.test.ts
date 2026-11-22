import { beforeEach, describe, expect, it, vi } from "vitest";
import { BatchService } from "./batch.service.ts";
import { AppError } from "../../../shared/error.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const PURCHASE_ORDER_ID = "507f1f77bcf86cd799439071";
const USER_ID = "507f1f77bcf86cd799439031";

const manufacturingDate = new Date("2026-01-01T00:00:00Z");
const expiryDate = new Date("2027-01-01T00:00:00Z");

function buildBatch(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => BATCH_ID },
    medicineId: { toString: () => MEDICINE_ID },
    purchaseOrderId: { toString: () => PURCHASE_ORDER_ID },
    batchNumber: "B-1",
    expiryDate,
    manufacturingDate,
    purchasePrice: 10,
    sellingPrice: 15,
    quantityReceived: 10,
    quantityRemaining: 5,
    isExpired: false,
    isActive: true,
    ...overrides,
  };
}

function buildCtx() {
  return {
    referenceId: BATCH_ID,
    referenceType: "ADJUSTMENT" as const,
    movementType: "ADJUSTMENT" as const,
    performedBy: USER_ID,
    remarks: "test",
  };
}

function buildService() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = { startSession: vi.fn().mockResolvedValue(session) };

  const batchRepo = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByMedicineId: vi.fn(),
    findPage: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const saleItemRepo = {
    existsByBatchId: vi.fn().mockResolvedValue(false),
  };
  const purchaseOrderRepo = { findById: vi.fn() };
  const stockMutation = {
    receiveStock: vi.fn().mockResolvedValue({ batch: buildBatch() }),
    increaseBatchStock: vi.fn().mockResolvedValue({ batch: buildBatch() }),
    decreaseBatchStock: vi.fn().mockResolvedValue({ batch: buildBatch() }),
    setBatchStock: vi.fn().mockResolvedValue({ batch: buildBatch() }),
    writeOffBatchStock: vi.fn().mockResolvedValue({ batch: buildBatch() }),
    syncAggregate: vi.fn().mockResolvedValue({}),
  };

  const service = new BatchService(
    batchRepo as never,
    saleItemRepo as never,
    purchaseOrderRepo as never,
    stockMutation as never,
    AppError,
    connection as never,
  );

  return {
    service,
    session,
    connection,
    batchRepo,
    saleItemRepo,
    purchaseOrderRepo,
    stockMutation,
  };
}

describe("BatchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBatchesPage", () => {
    it("filters batches by purchase order", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findPage.mockResolvedValue([
        { ...buildBatch(), createdAt: new Date("2026-01-01") },
      ]);

      await service.getBatchesPage({
        purchaseOrderId: PURCHASE_ORDER_ID,
        limit: 20,
      } as never);

      expect(batchRepo.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ purchaseOrderId: PURCHASE_ORDER_ID }),
        null,
        21,
      );
    });
  });

  describe("createBatch", () => {
    it("creates the batch and delegates the movement plus aggregate sync", async () => {
      const { service, batchRepo, purchaseOrderRepo, stockMutation, session } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({ _id: PURCHASE_ORDER_ID });
      batchRepo.create.mockResolvedValue(buildBatch());

      await service.createBatch(
        {
          purchaseOrderId: PURCHASE_ORDER_ID,
          medicineId: MEDICINE_ID,
          batchNumber: "B-1",
          manufacturingDate,
          expiryDate,
          purchasePrice: 10,
          sellingPrice: 15,
          quantityReceived: 5,
          quantityRemaining: 5,
        },
        undefined,
        {
          referenceId: PURCHASE_ORDER_ID,
          referenceType: "PURCHASE_ORDER",
          movementType: "PURCHASE",
          performedBy: USER_ID,
        },
      );

      expect(stockMutation.receiveStock).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          batchId: BATCH_ID,
          quantity: 5,
          session,
        }),
      );
      expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    it("rejects a new batch whose remaining quantity differs from received", async () => {
      const { service } = buildService();

      await expect(
        service.createBatch(
          {
            purchaseOrderId: PURCHASE_ORDER_ID,
            medicineId: MEDICINE_ID,
            batchNumber: "B-1",
            manufacturingDate,
            expiryDate,
            purchasePrice: 10,
            sellingPrice: 15,
            quantityReceived: 5,
            quantityRemaining: 4,
          },
          undefined,
          buildCtx(),
        ),
      ).rejects.toMatchObject({
        message:
          "New batches must start with quantityRemaining equal to quantityReceived",
        statusCode: 400,
      });
    });
  });

  describe("updateBatch", () => {
    it("routes a quantity change through setBatchStock", async () => {
      const { service, batchRepo, stockMutation } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityReceived: 10 }));
      stockMutation.setBatchStock.mockResolvedValue({
        batch: buildBatch({ quantityRemaining: 7 }),
      });

      const updated = await service.updateBatch(
        BATCH_ID,
        { quantityRemaining: 7 },
        undefined,
        buildCtx(),
      );

      expect(stockMutation.setBatchStock).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: BATCH_ID, newQuantity: 7 }),
      );
      expect(updated.quantityRemaining).toBe(7);
    });

    it("rejects marking a batch inactive while it still has stock", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityRemaining: 5 }));

      await expect(
        service.updateBatch(BATCH_ID, { isActive: false }),
      ).rejects.toMatchObject({
        message:
          "Batch can only be marked as inactive if quantity remaining is zero",
        statusCode: 400,
      });
    });

    it("rejects a quantity above quantityReceived", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityReceived: 10 }));

      await expect(
        service.updateBatch(
          BATCH_ID,
          { quantityRemaining: 11 },
          undefined,
          buildCtx(),
        ),
      ).rejects.toMatchObject({
        message: "quantityRemaining cannot exceed quantityReceived",
        statusCode: 400,
      });
    });

    it("rejects immutable fields", async () => {
      const { service } = buildService();

      await expect(
        service.updateBatch(BATCH_ID, { medicineId: MEDICINE_ID } as never),
      ).rejects.toMatchObject({
        message: "Field medicineId cannot be updated",
        statusCode: 400,
      });
    });
  });

  describe("deleteBatch", () => {
    it("blocks deleting a batch with stock", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityRemaining: 1 }));

      await expect(service.deleteBatch(BATCH_ID)).rejects.toMatchObject({
        message: "Cannot delete a batch with stock",
        statusCode: 409,
      });
      expect(batchRepo.delete).not.toHaveBeenCalled();
    });

    it("blocks deleting a sold-out batch referenced by sales", async () => {
      const { service, batchRepo, saleItemRepo } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityRemaining: 0 }));
      saleItemRepo.existsByBatchId.mockResolvedValue(true);

      await expect(service.deleteBatch(BATCH_ID)).rejects.toMatchObject({
        message:
          "Cannot delete a batch referenced by sales; COGS and returns depend on it",
        statusCode: 409,
      });
      expect(batchRepo.delete).not.toHaveBeenCalled();
    });

    it("deletes a zero-stock batch with no sales history", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch({ quantityRemaining: 0 }));
      batchRepo.delete.mockResolvedValue(buildBatch({ quantityRemaining: 0 }));

      await service.deleteBatch(BATCH_ID);

      expect(batchRepo.delete).toHaveBeenCalledWith(BATCH_ID, undefined);
    });
  });

  describe("batch quantity endpoints", () => {
    it("delegates deduct, increase, and adjust with movement context", async () => {
      const { service, batchRepo, stockMutation } = buildService();
      batchRepo.findById.mockResolvedValue(buildBatch());
      stockMutation.decreaseBatchStock.mockResolvedValue({
        batch: buildBatch({ quantityRemaining: 3 }),
      });
      stockMutation.increaseBatchStock.mockResolvedValue({
        batch: buildBatch({ quantityRemaining: 7 }),
      });
      stockMutation.setBatchStock.mockResolvedValue({
        batch: buildBatch({ quantityRemaining: 2 }),
      });

      await service.deductQuantity(BATCH_ID, 2, undefined, buildCtx());
      await service.increaseQuantity(BATCH_ID, 2, undefined, buildCtx());
      await service.adjustStock(BATCH_ID, 2, undefined, buildCtx());

      expect(stockMutation.decreaseBatchStock).toHaveBeenCalledTimes(1);
      expect(stockMutation.increaseBatchStock).toHaveBeenCalledTimes(1);
      expect(stockMutation.setBatchStock).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: BATCH_ID, newQuantity: 2 }),
      );
    });
  });

  describe("confirmDisposal", () => {
    it("writes off the whole expired batch in one transaction", async () => {
      const { service, batchRepo, stockMutation, session } = buildService();
      batchRepo.findById.mockResolvedValue(
        buildBatch({ isExpired: true, quantityRemaining: 3 }),
      );
      stockMutation.writeOffBatchStock.mockResolvedValue({
        batch: buildBatch({ isExpired: true, quantityRemaining: 0 }),
      });

      await service.confirmDisposal(BATCH_ID, USER_ID);

      expect(stockMutation.writeOffBatchStock).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          batchId: BATCH_ID,
          quantity: 3,
          ctx: expect.objectContaining({
            movementType: "EXPIRED",
            performedBy: USER_ID,
          }),
          session,
        }),
      );
      expect(session.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAvailableBatches", () => {
    it("excludes flagged expired batches even when the date is in the future", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findAllByMedicineId.mockResolvedValue([
        buildBatch({ _id: { toString: () => "ok" } }),
        buildBatch({ _id: { toString: () => "flagged" }, isExpired: true }),
      ]);

      const batches = await service.getAvailableBatches(MEDICINE_ID);

      expect(batches).toHaveLength(1);
      expect(batches[0]?._id.toString()).toBe("ok");
    });
  });
});
