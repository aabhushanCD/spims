import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockMutationService } from "./stockMutation.service.ts";
import { AppError } from "../../../shared/error.ts";
import type { StockMovementCtx } from "../types/stockMovement.type.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const USER_ID = "507f1f77bcf86cd799439031";
const REFERENCE_ID = "507f1f77bcf86cd799439041";

const futureDate = new Date("2030-01-01T00:00:00Z");

function buildCtx(
  movementType: StockMovementCtx["movementType"] = "ADJUSTMENT",
): StockMovementCtx {
  return {
    medicineId: MEDICINE_ID,
    referenceId: REFERENCE_ID,
    referenceType: "ADJUSTMENT",
    movementType,
    performedBy: USER_ID,
    remarks: "test",
  };
}

interface InventoryState {
  _id: string;
  medicineId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: Date;
  version: number;
}

interface BatchState {
  _id: string;
  medicineId: string;
  batchNumber: string;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate: Date;
  manufacturingDate: Date;
  isExpired: boolean;
}

function buildHarness() {
  const state: {
    inventory: InventoryState | null;
    batches: Map<string, BatchState>;
    movements: Array<Record<string, unknown>>;
    ownedSessions: number;
  } = {
    inventory: null,
    batches: new Map(),
    movements: [],
    ownedSessions: 0,
  };

  const cloneBatch = (batch: BatchState) => ({ ...batch });

  const inventoryRepo = {
    findByMedicineId: vi.fn(async (medicineId: string) => {
      if (!state.inventory || state.inventory.medicineId !== medicineId) {
        return null;
      }
      return { ...state.inventory };
    }),
    create: vi.fn(async (data: Record<string, unknown>) => {
      if (state.inventory) {
        throw Object.assign(new Error("duplicate key"), { code: 11000 });
      }
      state.inventory = {
        _id: "inv-1",
        medicineId: String(data.medicineId),
        currentStock: data.currentStock as number,
        reservedStock: data.reservedStock as number,
        availableStock: data.availableStock as number,
        lastUpdated: new Date(),
        version: 0,
      };
      return { ...state.inventory };
    }),
    update: vi.fn(async (id: string, data: Record<string, unknown>) => {
      if (!state.inventory || state.inventory._id !== id) return null;
      Object.assign(state.inventory, data);
      return { ...state.inventory };
    }),
    updateWithVersion: vi.fn(
      async (id: string, expectedVersion: number, data: Record<string, unknown>) => {
        if (
          !state.inventory ||
          state.inventory._id !== id ||
          (state.inventory.version ?? 0) !== expectedVersion
        ) {
          return null;
        }
        Object.assign(state.inventory, data);
        state.inventory.version += 1;
        return { ...state.inventory };
      },
    ),
  };

  const batchRepo = {
    findById: vi.fn(async (batchId: string) => {
      const batch = state.batches.get(batchId);
      return batch ? cloneBatch(batch) : null;
    }),
    getTotalStock: vi.fn(async (medicineId: string) => {
      let total = 0;
      for (const batch of state.batches.values()) {
        if (
          batch.medicineId === medicineId &&
          batch.quantityRemaining > 0 &&
          batch.expiryDate > new Date() &&
          !batch.isExpired
        ) {
          total += batch.quantityRemaining;
        }
      }
      return total;
    }),
    increaseBatchStock: vi.fn(
      async (
        batchId: string,
        quantity: number,
        expectedQuantity: number,
      ) => {
        const batch = state.batches.get(batchId);
        if (!batch || batch.quantityRemaining !== expectedQuantity) return null;
        batch.quantityRemaining += quantity;
        return cloneBatch(batch);
      },
    ),
    setBatchStock: vi.fn(
      async (
        batchId: string,
        expectedQuantity: number,
        newQuantity: number,
      ) => {
        const batch = state.batches.get(batchId);
        if (!batch || batch.quantityRemaining !== expectedQuantity) return null;
        batch.quantityRemaining = newQuantity;
        return cloneBatch(batch);
      },
    ),
    deductBatchStock: vi.fn(async (batchId: string, quantity: number) => {
      const batch = state.batches.get(batchId);
      if (!batch || batch.quantityRemaining < quantity) return null;
      batch.quantityRemaining -= quantity;
      return cloneBatch(batch);
    }),
    update: vi.fn(
      async (batchId: string, data: { quantityRemaining?: number }) => {
        const batch = state.batches.get(batchId);
        if (!batch) return null;
        Object.assign(batch, data);
        return cloneBatch(batch);
      },
    ),
  };

  const inventoryMovementService = {
    createMovement: vi.fn(
      async (movement: Record<string, unknown>) => {
        state.movements.push(movement);
        return movement;
      },
    ),
  };

  const ownedSession = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = {
    startSession: vi.fn(async () => {
      state.ownedSessions += 1;
      return ownedSession;
    }),
  };

  const cacheInvalidator = {
    invalidateDashboard: vi.fn().mockResolvedValue(undefined),
    invalidateReorder: vi.fn().mockResolvedValue(undefined),
  };

  const service = new StockMutationService(
    inventoryRepo as never,
    batchRepo as never,
    inventoryMovementService as never,
    AppError,
    connection as never,
    cacheInvalidator,
  );

  const addBatch = (overrides: Record<string, unknown> = {}) => {
    state.batches.set(BATCH_ID, {
      _id: BATCH_ID,
      medicineId: MEDICINE_ID,
      batchNumber: "B-1",
      quantityReceived: 10,
      quantityRemaining: 10,
      expiryDate: futureDate,
      manufacturingDate: new Date("2029-01-01T00:00:00Z"),
      isExpired: false,
      ...overrides,
    });
  };

  return {
    service,
    state,
    inventoryRepo,
    batchRepo,
    inventoryMovementService,
    connection,
    ownedSession,
    addBatch,
    cacheInvalidator,
  };
}

describe("StockMutationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("receiveStock creates the aggregate from batch truth and writes one movement", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 4 });

    await harness.service.receiveStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 4,
      ctx: buildCtx("PURCHASE"),
    });

    expect(harness.state.inventory).toMatchObject({
      currentStock: 4,
      reservedStock: 0,
      availableStock: 4,
    });
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      batchId: BATCH_ID,
      quantity: 4,
      movementType: "PURCHASE",
    });
    expect(harness.state.ownedSessions).toBe(1);
    expect(harness.ownedSession.endSession).toHaveBeenCalledTimes(1);
  });

  it("joins a caller session without starting or ending its own", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 4 });
    const callerSession = {
      withTransaction: vi.fn(),
      endSession: vi.fn(),
    };

    await harness.service.receiveStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 4,
      ctx: buildCtx("PURCHASE"),
      session: callerSession as never,
    });

    expect(harness.connection.startSession).not.toHaveBeenCalled();
    expect(callerSession.endSession).not.toHaveBeenCalled();
  });

  it("increaseBatchStock increases the batch, syncs, and writes one movement", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 8 });

    const result = await harness.service.increaseBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 2,
      ctx: buildCtx("RETURN"),
    });

    expect(result.batch.quantityRemaining).toBe(10);
    expect(harness.state.inventory?.currentStock).toBe(10);
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      batchId: BATCH_ID,
      quantity: 2,
      movementType: "RETURN",
    });
  });

  it("rejects an increase above the original received quantity", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 10 });

    await expect(
      harness.service.increaseBatchStock({
        medicineId: MEDICINE_ID,
        batchId: BATCH_ID,
        quantity: 1,
        ctx: buildCtx("RETURN"),
      }),
    ).rejects.toMatchObject({
      message: "Increase would exceed the original received quantity",
      statusCode: 409,
    });
    expect(harness.state.movements).toHaveLength(0);
  });

  it("decreaseBatchStock deducts the batch and writes one movement", async () => {
    const harness = buildHarness();
    harness.addBatch();

    const result = await harness.service.decreaseBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 3,
      ctx: buildCtx("SALE"),
    });

    expect(result.batch.quantityRemaining).toBe(7);
    expect(harness.state.inventory?.currentStock).toBe(7);
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      batchId: BATCH_ID,
      quantity: 3,
      movementType: "SALE",
    });
  });

  it("decreaseBatchStock rejects insufficient stock with a conflict", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 1 });

    await expect(
      harness.service.decreaseBatchStock({
        medicineId: MEDICINE_ID,
        batchId: BATCH_ID,
        quantity: 2,
        ctx: buildCtx("SALE"),
      }),
    ).rejects.toMatchObject({
      message: "Insufficient batch stock",
      statusCode: 409,
    });
  });

  it("setBatchStock records the absolute delta", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 8 });

    const result = await harness.service.setBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      newQuantity: 5,
      ctx: buildCtx("ADJUSTMENT"),
    });

    expect(result.batch.quantityRemaining).toBe(5);
    expect(harness.state.inventory?.currentStock).toBe(5);
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      quantity: 3,
      movementType: "ADJUSTMENT",
    });
  });

  it("setBatchStock writes no movement when the quantity is unchanged", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 8 });

    await harness.service.setBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      newQuantity: 8,
      ctx: buildCtx("ADJUSTMENT"),
    });

    expect(harness.state.movements).toHaveLength(0);
  });

  it("writeOffBatchStock zeroes the batch and writes one movement", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 4, isExpired: true });

    const result = await harness.service.writeOffBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 4,
      ctx: buildCtx("EXPIRED"),
    });

    expect(result.batch.quantityRemaining).toBe(0);
    expect(harness.state.inventory?.currentStock).toBe(0);
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      quantity: 4,
      movementType: "EXPIRED",
    });
  });

  it("recordMovement writes a batch-less movement without touching stock", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 4 });

    await harness.service.recordMovement(buildCtx("ADJUSTMENT"), 2);

    expect(harness.state.inventory).toBeNull();
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]?.batchId).toBeUndefined();
  });

  it("reserveStock and releaseStock keep reserved and available stock consistent", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 10 });

    const reserved = await harness.service.reserveStock({
      medicineId: MEDICINE_ID,
      quantity: 4,
      ctx: buildCtx("RESERVE"),
    });
    expect(reserved).toMatchObject({
      currentStock: 10,
      reservedStock: 4,
      availableStock: 6,
    });

    const released = await harness.service.releaseStock({
      medicineId: MEDICINE_ID,
      quantity: 4,
      ctx: buildCtx("RELEASE"),
    });
    expect(released).toMatchObject({
      currentStock: 10,
      reservedStock: 0,
      availableStock: 10,
    });
    expect(harness.state.movements.map((m) => m.movementType)).toEqual([
      "RESERVE",
      "RELEASE",
    ]);
  });

  it("rejects over-release and over-reservation", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 2 });

    await expect(
      harness.service.reserveStock({
        medicineId: MEDICINE_ID,
        quantity: 3,
        ctx: buildCtx("RESERVE"),
      }),
    ).rejects.toMatchObject({
      message: "Insufficient stock available to reserve",
      statusCode: 400,
    });

    await expect(
      harness.service.releaseStock({
        medicineId: MEDICINE_ID,
        quantity: 1,
        ctx: buildCtx("RELEASE"),
      }),
    ).rejects.toMatchObject({
      message: "Cannot release more than the reserved quantity",
      statusCode: 400,
    });
  });

  it("clamps reservedStock to batch truth during reconciliation", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 5 });
    harness.state.inventory = {
      _id: "inv-1",
      medicineId: MEDICINE_ID,
      currentStock: 5,
      reservedStock: 8,
      availableStock: -3,
      lastUpdated: new Date(),
      version: 0,
    };

    const synced = await harness.service.syncAggregate(MEDICINE_ID);

    expect(synced).toMatchObject({
      currentStock: 5,
      reservedStock: 5,
      availableStock: 0,
    });
  });

  it("maps a duplicate aggregate row to a conflict during sync", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 2 });
    harness.inventoryRepo.create.mockRejectedValue(
      Object.assign(new Error("duplicate key"), { code: 11000 }),
    );

    await expect(
      harness.service.syncAggregate(MEDICINE_ID),
    ).rejects.toMatchObject({
      message: "Inventory already exists for this medicine",
      statusCode: 409,
    });
  });

  it("maps a duplicate aggregate row to a conflict during explicit creation", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 2 });
    harness.inventoryRepo.create.mockRejectedValue(
      Object.assign(new Error("duplicate key"), { code: 11000 }),
    );

    await expect(
      harness.service.initializeAggregate({
        medicineId: MEDICINE_ID,
        reservedStock: 0,
      }),
    ).rejects.toMatchObject({
      message: "Inventory already exists for this medicine",
      statusCode: 409,
    });
  });

  it("syncAggregate writes an ADJUSTMENT only when a context and delta exist", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 8 });
    harness.state.inventory = {
      _id: "inv-1",
      medicineId: MEDICINE_ID,
      currentStock: 10,
      reservedStock: 0,
      availableStock: 10,
      lastUpdated: new Date(),
      version: 0,
    };

    const withoutContext = await harness.service.syncAggregate(MEDICINE_ID);
    expect(withoutContext.currentStock).toBe(8);
    expect(harness.state.movements).toHaveLength(0);

    harness.state.inventory.currentStock = 7;
    await harness.service.syncAggregate(MEDICINE_ID, {
      ctx: buildCtx("ADJUSTMENT"),
    });
    expect(harness.state.movements).toHaveLength(1);
    expect(harness.state.movements[0]).toMatchObject({
      quantity: 1,
      movementType: "ADJUSTMENT",
    });

    await harness.service.syncAggregate(MEDICINE_ID, {
      ctx: buildCtx("ADJUSTMENT"),
    });
    expect(harness.state.movements).toHaveLength(1);
  });

  it("invalidates dashboard and medicine caches after a stock mutation", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 4 });

    await harness.service.receiveStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 4,
      ctx: buildCtx("PURCHASE"),
    });

    expect(harness.cacheInvalidator.invalidateDashboard).toHaveBeenCalled();
    expect(harness.cacheInvalidator.invalidateReorder).toHaveBeenCalledWith(
      MEDICINE_ID,
    );
  });

  it("keeps the stock invariant through receive, sale, return, reserve, release and disposal", async () => {
    const harness = buildHarness();
    harness.addBatch({ quantityRemaining: 10, quantityReceived: 20 });

    await harness.service.receiveStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 10,
      ctx: buildCtx("PURCHASE"),
    });

    await harness.service.decreaseBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 3,
      ctx: buildCtx("SALE"),
    });
    await harness.service.increaseBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: 1,
      ctx: buildCtx("RETURN"),
    });
    await harness.service.reserveStock({
      medicineId: MEDICINE_ID,
      quantity: 2,
      ctx: buildCtx("RESERVE"),
    });
    await harness.service.releaseStock({
      medicineId: MEDICINE_ID,
      quantity: 1,
      ctx: buildCtx("RELEASE"),
    });

    const batchTotal = [...harness.state.batches.values()]
      .filter(
        (candidate) =>
          candidate.quantityRemaining > 0 &&
          candidate.expiryDate > new Date() &&
          !candidate.isExpired,
      )
      .reduce((sum, candidate) => sum + candidate.quantityRemaining, 0);
    expect(harness.state.inventory?.currentStock).toBe(batchTotal);
    expect(harness.state.inventory?.availableStock).toBe(
      batchTotal - (harness.state.inventory?.reservedStock ?? 0),
    );

    const remaining = harness.state.batches.get(BATCH_ID)!.quantityRemaining;
    harness.state.batches.get(BATCH_ID)!.isExpired = true;
    await harness.service.writeOffBatchStock({
      medicineId: MEDICINE_ID,
      batchId: BATCH_ID,
      quantity: remaining,
      ctx: buildCtx("EXPIRED"),
    });

    expect(harness.state.inventory?.currentStock).toBe(0);
    expect(harness.state.inventory?.availableStock).toBe(0);
    expect(harness.state.movements).toHaveLength(6);
  });
});
