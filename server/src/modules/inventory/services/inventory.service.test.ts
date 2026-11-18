import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryService } from "./inventory.service.ts";
import { AppError } from "../../../shared/error.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const OTHER_MEDICINE_ID = "507f1f77bcf86cd799439012";
const BATCH_ID = "507f1f77bcf86cd799439021";
const USER_ID = "507f1f77bcf86cd799439031";

const movementContext = {
  batchId: BATCH_ID,
  referenceId: "507f1f77bcf86cd799439041",
  referenceType: "SALE",
  movementType: "SALE" as const,
  performedBy: USER_ID,
  remarks: "test movement",
};

function buildService() {
  const inventoryRepo = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByMedicineId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    searchMedicines: vi.fn(),
  };

  const movementService = {
    createMovement: vi.fn(),
  };

  const batchRepo = {
    findSellableBatches: vi.fn(),
    deductBatchStock: vi.fn(),
    findById: vi.fn(),
    increaseBatchStock: vi.fn(),
    getTotalStock: vi.fn(),
  };

  const service = new InventoryService(
    inventoryRepo as never,
    movementService as never,
    batchRepo as never,
    AppError,
  );

  return { service, inventoryRepo, movementService, batchRepo };
}

describe("InventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sellMedicine (FEFO allocation)", () => {
    it("allocates across batches in the order supplied by the FEFO query", async () => {
      const { service, batchRepo, movementService } = buildService();
      vi.spyOn(service, "syncInventoryFromBatch").mockResolvedValue(
        {} as never,
      );

      batchRepo.findSellableBatches.mockResolvedValue([
        {
          _id: { toString: () => "batch-early" },
          batchNumber: "EARLY",
          medicineId: { toString: () => MEDICINE_ID },
          quantityRemaining: 5,
          sellingPrice: 10,
        },
        {
          _id: { toString: () => "batch-late" },
          batchNumber: "LATE",
          medicineId: { toString: () => MEDICINE_ID },
          quantityRemaining: 20,
          sellingPrice: 12,
        },
      ]);
      batchRepo.deductBatchStock.mockImplementation(
        async (batchId: string, quantity: number) => ({
          _id: batchId,
          quantityRemaining: quantity,
        }),
      );

      const allocations = await service.sellMedicine(
        MEDICINE_ID,
        12,
        movementContext,
      );

      expect(batchRepo.findSellableBatches).toHaveBeenCalledWith(
        MEDICINE_ID,
        undefined,
      );
      expect(allocations).toEqual([
        {
          batchId: "batch-early",
          batchNumber: "EARLY",
          medicineId: MEDICINE_ID,
          quantity: 5,
          unitPrice: 10,
        },
        {
          batchId: "batch-late",
          batchNumber: "LATE",
          medicineId: MEDICINE_ID,
          quantity: 7,
          unitPrice: 12,
        },
      ]);
      expect(batchRepo.deductBatchStock).toHaveBeenNthCalledWith(
        1,
        "batch-early",
        5,
        undefined,
      );
      expect(batchRepo.deductBatchStock).toHaveBeenNthCalledWith(
        2,
        "batch-late",
        7,
        undefined,
      );
      expect(movementService.createMovement).toHaveBeenCalledTimes(2);
      expect(movementService.createMovement).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          batchId: "batch-early",
          movementType: "SALE",
          quantity: 5,
        }),
        undefined,
      );
    });

    it("uses a single batch when it covers the full request", async () => {
      const { service, batchRepo } = buildService();
      vi.spyOn(service, "syncInventoryFromBatch").mockResolvedValue(
        {} as never,
      );
      batchRepo.findSellableBatches.mockResolvedValue([
        {
          _id: { toString: () => "batch-1" },
          batchNumber: "B-1",
          quantityRemaining: 10,
          sellingPrice: 25,
        },
      ]);
      batchRepo.deductBatchStock.mockResolvedValue({ _id: "batch-1" });

      const allocations = await service.sellMedicine(
        MEDICINE_ID,
        4,
        movementContext,
      );

      expect(allocations).toHaveLength(1);
      expect(allocations[0]?.quantity).toBe(4);
      expect(allocations[0]?.unitPrice).toBe(25);
    });

    it("rejects out-of-stock medicines", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findSellableBatches.mockResolvedValue([]);

      await expect(
        service.sellMedicine(MEDICINE_ID, 1, movementContext),
      ).rejects.toMatchObject({
        message: "Medicine is out of stock",
        statusCode: 400,
      });
    });

    it("rejects a request larger than total sellable stock", async () => {
      const { service, batchRepo, movementService } = buildService();
      batchRepo.findSellableBatches.mockResolvedValue([
        { _id: { toString: () => "batch-1" }, quantityRemaining: 2 },
      ]);

      await expect(
        service.sellMedicine(MEDICINE_ID, 5, movementContext),
      ).rejects.toMatchObject({
        message: "Only 2 units available.",
        statusCode: 400,
      });
      expect(movementService.createMovement).not.toHaveBeenCalled();
    });

    it("rejects non-positive quantities before touching storage", async () => {
      const { service, batchRepo } = buildService();

      await expect(
        service.sellMedicine(MEDICINE_ID, 0, movementContext),
      ).rejects.toMatchObject({
        message: "Quantity must be greater than zero",
        statusCode: 400,
      });
      expect(batchRepo.findSellableBatches).not.toHaveBeenCalled();
    });

    it("fails with a conflict when concurrent stock deduction loses the race", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findSellableBatches.mockResolvedValue([
        {
          _id: { toString: () => "batch-1" },
          batchNumber: "B-1",
          quantityRemaining: 10,
          sellingPrice: 10,
        },
      ]);
      batchRepo.deductBatchStock.mockResolvedValue(null);

      await expect(
        service.sellMedicine(MEDICINE_ID, 5, movementContext),
      ).rejects.toMatchObject({
        message: "Stock changed while processing sale for batch B-1",
        statusCode: 409,
      });
    });
  });

  describe("returnMedicine", () => {
    it("restores sellable stock for GOOD returns", async () => {
      const { service, batchRepo } = buildService();
      const increaseStock = vi
        .spyOn(service, "increaseStock")
        .mockResolvedValue({} as never);
      batchRepo.findById.mockResolvedValue({
        _id: BATCH_ID,
        medicineId: { toString: () => MEDICINE_ID },
      });

      await service.returnMedicine(
        MEDICINE_ID,
        BATCH_ID,
        3,
        "GOOD",
        movementContext,
      );

      expect(increaseStock).toHaveBeenCalledWith(
        MEDICINE_ID,
        3,
        movementContext,
        undefined,
      );
      expect(batchRepo.increaseBatchStock).not.toHaveBeenCalled();
    });

    it("does not return damaged stock to sellable inventory", async () => {
      const { service, batchRepo, movementService } = buildService();
      const increaseStock = vi.spyOn(service, "increaseStock");
      const sync = vi
        .spyOn(service, "syncInventoryFromBatch")
        .mockResolvedValue({} as never);
      batchRepo.findById.mockResolvedValue({
        _id: BATCH_ID,
        medicineId: { toString: () => MEDICINE_ID },
      });
      batchRepo.increaseBatchStock.mockResolvedValue({ _id: BATCH_ID });

      await service.returnMedicine(
        MEDICINE_ID,
        BATCH_ID,
        2,
        "DAMAGED",
        movementContext,
      );

      expect(increaseStock).not.toHaveBeenCalled();
      expect(batchRepo.increaseBatchStock).toHaveBeenCalledWith(
        BATCH_ID,
        2,
        undefined,
      );
      expect(movementService.createMovement).toHaveBeenCalledTimes(2);
      expect(movementService.createMovement).toHaveBeenLastCalledWith(
        expect.objectContaining({
          remarks: "test movement",
          movementType: "RETURN",
        }),
        undefined,
      );
      expect(sync).toHaveBeenCalledWith(MEDICINE_ID, undefined, undefined);
    });

    it("rejects non-positive return quantities", async () => {
      const { service } = buildService();

      await expect(
        service.returnMedicine(
          MEDICINE_ID,
          BATCH_ID,
          0,
          "GOOD",
          movementContext,
        ),
      ).rejects.toMatchObject({
        message: "Quantity must be greater than zero",
        statusCode: 400,
      });
    });

    it("rejects an unknown batch", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue(null);

      await expect(
        service.returnMedicine(
          MEDICINE_ID,
          BATCH_ID,
          1,
          "GOOD",
          movementContext,
        ),
      ).rejects.toMatchObject({
        message: "Batch not found",
        statusCode: 404,
      });
    });

    it("rejects a batch that belongs to another medicine", async () => {
      const { service, batchRepo } = buildService();
      batchRepo.findById.mockResolvedValue({
        _id: BATCH_ID,
        medicineId: { toString: () => OTHER_MEDICINE_ID },
      });

      await expect(
        service.returnMedicine(
          MEDICINE_ID,
          BATCH_ID,
          1,
          "GOOD",
          movementContext,
        ),
      ).rejects.toMatchObject({
        message: "Batch does not belong to medicine",
        statusCode: 400,
      });
    });
  });

  describe("aggregate stock operations", () => {
    it("increases current and available stock together", async () => {
      const { service, inventoryRepo, movementService } = buildService();
      inventoryRepo.findByMedicineId.mockResolvedValue({
        _id: "inv-1",
        currentStock: 10,
        availableStock: 8,
        reservedStock: 2,
      });
      inventoryRepo.update.mockImplementation(async (_id, data) => data);

      await service.increaseStock(MEDICINE_ID, 5, movementContext);

      expect(inventoryRepo.update).toHaveBeenCalledWith(
        "inv-1",
        expect.objectContaining({
          currentStock: 15,
          availableStock: 13,
        }),
        undefined,
      );
      expect(movementService.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ movementType: "SALE", quantity: 5 }),
        undefined,
      );
    });

    it("rejects deductions above available stock", async () => {
      const { service, inventoryRepo } = buildService();
      inventoryRepo.findByMedicineId.mockResolvedValue({
        _id: "inv-1",
        currentStock: 10,
        availableStock: 3,
        reservedStock: 7,
      });

      await expect(
        service.decreaseStock(MEDICINE_ID, 4, movementContext),
      ).rejects.toMatchObject({
        message: "Insufficient stock available",
        statusCode: 400,
      });
    });

    it("reserves stock without changing current stock", async () => {
      const { service, inventoryRepo } = buildService();
      inventoryRepo.findByMedicineId.mockResolvedValue({
        _id: "inv-1",
        currentStock: 10,
        availableStock: 10,
        reservedStock: 0,
      });
      inventoryRepo.update.mockImplementation(async (_id, data) => data);

      await service.reserveStock(MEDICINE_ID, 4, movementContext);

      expect(inventoryRepo.update).toHaveBeenCalledWith(
        "inv-1",
        expect.objectContaining({
          currentStock: 10,
          availableStock: 6,
        }),
        undefined,
      );
    });

    it("releases reserved stock back to available stock", async () => {
      const { service, inventoryRepo } = buildService();
      inventoryRepo.findByMedicineId.mockResolvedValue({
        _id: "inv-1",
        currentStock: 10,
        availableStock: 4,
        reservedStock: 6,
      });
      inventoryRepo.update.mockImplementation(async (_id, data) => data);

      await service.releaseReservedStock(MEDICINE_ID, 3, {
        ...movementContext,
        movementType: "RELEASE",
      });

      expect(inventoryRepo.update).toHaveBeenCalledWith(
        "inv-1",
        expect.objectContaining({ availableStock: 7 }),
        undefined,
      );
    });
  });
});
