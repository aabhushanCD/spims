import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryService } from "./inventory.service.ts";
import { AppError } from "../../../shared/error.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const OTHER_MEDICINE_ID = "507f1f77bcf86cd799439012";
const BATCH_ID = "507f1f77bcf86cd799439021";
const BATCH_2_ID = "507f1f77bcf86cd799439022";
const USER_ID = "507f1f77bcf86cd799439031";

const movementContext = {
  batchId: BATCH_ID,
  referenceId: "507f1f77bcf86cd799439041",
  referenceType: "SALE" as const,
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

  const batchRepo = {
    findSellableBatches: vi.fn(),
    findById: vi.fn(),
    getTotalStock: vi.fn(),
  };

  const stockMutation = {
    decreaseBatchStock: vi.fn().mockResolvedValue({ batch: {} }),
    increaseBatchStock: vi.fn().mockResolvedValue({ batch: {}, inventory: {} }),
    recordMovement: vi.fn(),
    syncAggregate: vi.fn().mockResolvedValue({}),
    initializeAggregate: vi.fn().mockResolvedValue({}),
    reserveStock: vi.fn().mockResolvedValue({}),
    releaseStock: vi.fn().mockResolvedValue({}),
  };

  const service = new InventoryService(
    inventoryRepo as never,
    batchRepo as never,
    stockMutation as never,
    AppError,
  );

  return { service, inventoryRepo, batchRepo, stockMutation };
}

describe("InventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sellMedicine (FEFO allocation)", () => {
    it("mutates each batch without syncing, then syncs once", async () => {
      const { service, batchRepo, stockMutation } = buildService();
      batchRepo.findSellableBatches.mockResolvedValue([
        {
          _id: { toString: () => BATCH_ID },
          batchNumber: "EARLY",
          medicineId: { toString: () => MEDICINE_ID },
          quantityRemaining: 5,
          sellingPrice: 10,
        },
        {
          _id: { toString: () => BATCH_2_ID },
          batchNumber: "LATE",
          medicineId: { toString: () => MEDICINE_ID },
          quantityRemaining: 20,
          sellingPrice: 12,
        },
      ]);

      const allocations = await service.sellMedicine(
        MEDICINE_ID,
        12,
        movementContext,
      );

      expect(allocations).toEqual([
        {
          batchId: BATCH_ID,
          batchNumber: "EARLY",
          medicineId: MEDICINE_ID,
          quantity: 5,
          unitPrice: 10,
        },
        {
          batchId: BATCH_2_ID,
          batchNumber: "LATE",
          medicineId: MEDICINE_ID,
          quantity: 7,
          unitPrice: 12,
        },
      ]);
      expect(stockMutation.decreaseBatchStock).toHaveBeenCalledTimes(2);
      expect(stockMutation.decreaseBatchStock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          batchId: BATCH_ID,
          quantity: 5,
          sync: false,
        }),
      );
      expect(stockMutation.syncAggregate).toHaveBeenCalledTimes(1);
      expect(stockMutation.syncAggregate).toHaveBeenCalledWith(MEDICINE_ID, {
        session: undefined,
      });
    });

    it("rejects out-of-stock medicines", async () => {
      const { service, batchRepo, stockMutation } = buildService();
      batchRepo.findSellableBatches.mockResolvedValue([]);

      await expect(
        service.sellMedicine(MEDICINE_ID, 1, movementContext),
      ).rejects.toMatchObject({
        message: "Medicine is out of stock",
        statusCode: 400,
      });
      expect(stockMutation.decreaseBatchStock).not.toHaveBeenCalled();
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
  });

  describe("returnMedicine", () => {
    it("restores the batch for GOOD returns through the mutation service", async () => {
      const { service, batchRepo, stockMutation } = buildService();
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

      expect(stockMutation.increaseBatchStock).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          batchId: BATCH_ID,
          quantity: 3,
        }),
      );
      expect(stockMutation.recordMovement).not.toHaveBeenCalled();
    });

    it("writes one write-off movement and no stock change for damaged returns", async () => {
      const { service, batchRepo, stockMutation } = buildService();
      batchRepo.findById.mockResolvedValue({
        _id: BATCH_ID,
        medicineId: { toString: () => MEDICINE_ID },
      });

      await service.returnMedicine(
        MEDICINE_ID,
        BATCH_ID,
        2,
        "DAMAGED",
        movementContext,
      );

      expect(stockMutation.increaseBatchStock).not.toHaveBeenCalled();
      expect(stockMutation.decreaseBatchStock).not.toHaveBeenCalled();
      expect(stockMutation.recordMovement).toHaveBeenCalledTimes(1);
      expect(stockMutation.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          batchId: BATCH_ID,
          movementType: "RETURN",
        }),
        2,
        undefined,
      );
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
      ).rejects.toMatchObject({ message: "Batch not found", statusCode: 404 });
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
    it("requires batchId for increases", async () => {
      const { service, stockMutation } = buildService();
      const { batchId: _batchId, ...ctxWithoutBatch } = movementContext;

      await expect(
        service.increaseStock(MEDICINE_ID, 5, ctxWithoutBatch),
      ).rejects.toMatchObject({
        message: "batchId is required for stock changes",
        statusCode: 400,
      });
      expect(stockMutation.increaseBatchStock).not.toHaveBeenCalled();
    });

    it("delegates reservation accounting with the session attached", async () => {
      const { service, stockMutation } = buildService();
      const session = { id: "session" } as never;

      await service.reserveStock(MEDICINE_ID, 4, movementContext, session);

      expect(stockMutation.reserveStock).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          quantity: 4,
        }),
      );
    });

    it("delegates release accounting", async () => {
      const { service, stockMutation } = buildService();

      await service.releaseReservedStock(MEDICINE_ID, 3, {
        ...movementContext,
        movementType: "RELEASE",
      });

      expect(stockMutation.releaseStock).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          quantity: 3,
        }),
      );
    });

    it("derives current stock from batches when creating inventory", async () => {
      const { service, stockMutation } = buildService();

      await service.createInventory({
        medicineId: MEDICINE_ID,
        currentStock: 999,
        availableStock: 999,
        reservedStock: 2,
      });

      expect(stockMutation.initializeAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          reservedStock: 2,
        }),
      );
    });

    it("rejects direct currentStock updates", async () => {
      const { service } = buildService();

      await expect(
        service.updateInventory("inv-1", { currentStock: 10 }),
      ).rejects.toMatchObject({
        message:
          "Field currentStock cannot be updated directly; stock is derived from batches",
        statusCode: 400,
      });
    });

    it("blocks deletion while the inventory holds stock", async () => {
      const { service, inventoryRepo, batchRepo } = buildService();
      inventoryRepo.findById.mockResolvedValue({
        _id: "inv-1",
        medicineId: { toString: () => MEDICINE_ID },
        currentStock: 4,
        reservedStock: 0,
      });
      batchRepo.getTotalStock.mockResolvedValue(4);

      await expect(service.deleteInventory("inv-1")).rejects.toMatchObject({
        message: "Cannot delete inventory with stock or reservations",
        statusCode: 409,
      });
      expect(inventoryRepo.delete).not.toHaveBeenCalled();
    });
  });
});
