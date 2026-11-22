import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { SmartReorderService } from "./smartReorder.service.ts";
import { AppError } from "../../../shared/error.ts";
import { getCache, setCache } from "../../../shared/provider/redis.provider.ts";

vi.mock("../../../shared/provider/redis.provider.ts", () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const SUPPLIER_ID = new Types.ObjectId("507f1f77bcf86cd799439021");
const PO_ID = new Types.ObjectId("507f1f77bcf86cd799439031");

function buildService() {
  const smartReorderRepo = {
    create: vi.fn(),
    upsertPending: vi.fn(async (data: Record<string, unknown>) => ({
      _id: new Types.ObjectId(),
      ...data,
    })),
    findAll: vi.fn().mockResolvedValue([]),
    findByStatus: vi.fn().mockResolvedValue([]),
  };
  const medicineRepo = {
    findById: vi.fn().mockResolvedValue({ _id: MEDICINE_ID }),
  };
  const saleItemRepo = {
    getDailySalesForMedicine: vi.fn().mockResolvedValue(Array(30).fill(5)),
  };
  const batchRepo = {
    findMostRecentPurchaseOrderId: vi.fn().mockResolvedValue(PO_ID),
    getUsableStock: vi.fn().mockResolvedValue(0),
    getExpiringUnits: vi.fn().mockResolvedValue(0),
  };
  const purchaseOrderRepo = {
    findById: vi.fn().mockResolvedValue({ supplierId: SUPPLIER_ID }),
    findRecentBySupplier: vi.fn().mockResolvedValue([
      {
        receivedDate: new Date("2026-01-10T00:00:00Z"),
        expectedDeliveryDate: new Date("2026-01-09T00:00:00Z"),
      },
    ]),
  };
  const supplierRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: SUPPLIER_ID,
      leadTime: 2,
      reliabilityScore: 90,
    }),
    updateReliabilityScore: vi.fn().mockResolvedValue({}),
  };
  const cacheInvalidator = {
    invalidateDashboard: vi.fn().mockResolvedValue(undefined),
    invalidateReorder: vi.fn().mockResolvedValue(undefined),
  };

  const service = new SmartReorderService(
    smartReorderRepo as never,
    {} as never,
    medicineRepo as never,
    saleItemRepo as never,
    batchRepo as never,
    purchaseOrderRepo as never,
    supplierRepo as never,
    AppError,
    cacheInvalidator,
  );

  return {
    service,
    smartReorderRepo,
    saleItemRepo,
    batchRepo,
    purchaseOrderRepo,
    supplierRepo,
    cacheInvalidator,
  };
}

describe("SmartReorderService", () => {
  beforeEach(() => {
    vi.mocked(getCache).mockReset();
    vi.mocked(setCache).mockReset();
    vi.mocked(getCache).mockResolvedValue(null);
  });

  it("keeps a cached negative result as a 400 instead of returning success", async () => {
    vi.mocked(getCache).mockResolvedValue({
      reorderNeeded: false,
      reason: "Medicine is not currently below reorder point",
    });
    const { service, smartReorderRepo } = buildService();

    await expect(
      service.generateRecommendationForMedicine(MEDICINE_ID),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Medicine is not currently below reorder point",
    });
    expect(smartReorderRepo.upsertPending).not.toHaveBeenCalled();
  });

  it("upserts the pending recommendation rather than creating a duplicate", async () => {
    const { service, smartReorderRepo, cacheInvalidator } = buildService();

    await service.generateRecommendationForMedicine(MEDICINE_ID);

    expect(smartReorderRepo.upsertPending).toHaveBeenCalledOnce();
    expect(smartReorderRepo.create).not.toHaveBeenCalled();
    expect(vi.mocked(setCache)).toHaveBeenCalled();
    expect(cacheInvalidator.invalidateDashboard).toHaveBeenCalled();
  });

  it("ignores missing delivery dates instead of producing NaN", async () => {
    const { service, purchaseOrderRepo, supplierRepo } = buildService();
    purchaseOrderRepo.findRecentBySupplier.mockResolvedValue([
      { receivedDate: new Date(), expectedDeliveryDate: null },
      { receivedDate: new Date(), expectedDeliveryDate: undefined },
    ]);

    const recommendation = await service.generateRecommendationForMedicine(
      MEDICINE_ID,
    );

    expect(recommendation?.confidenceScore).toBeTypeOf("number");
    expect(Number.isNaN(recommendation?.confidenceScore)).toBe(false);
    expect(supplierRepo.updateReliabilityScore).not.toHaveBeenCalled();
  });

  it("asks the repo for expiry risk only between now and the cutoff", async () => {
    const { service, batchRepo } = buildService();
    const before = Date.now();

    await service.generateRecommendationForMedicine(MEDICINE_ID);

    const lower = batchRepo.getExpiringUnits.mock.calls[0]?.[1] as Date;
    const upper = batchRepo.getExpiringUnits.mock.calls[0]?.[2] as Date;
    expect(lower.getTime()).toBeGreaterThanOrEqual(before);
    expect(upper.getTime()).toBeGreaterThan(lower.getTime());
  });

  describe("getAll", () => {
    it("defaults to pending recommendations", async () => {
      const { service, smartReorderRepo } = buildService();

      await service.getAll();

      expect(smartReorderRepo.findAll).toHaveBeenCalledWith("PENDING");
      expect(smartReorderRepo.findByStatus).not.toHaveBeenCalled();
    });

    it("returns all statuses only when explicitly requested", async () => {
      const { service, smartReorderRepo } = buildService();

      await service.getAll("ALL");

      expect(smartReorderRepo.findAll).toHaveBeenCalledWith();
    });

    it("delegates a specific status to findByStatus", async () => {
      const { service, smartReorderRepo } = buildService();

      await service.getAll("APPROVED");

      expect(smartReorderRepo.findByStatus).toHaveBeenCalledWith("APPROVED");
    });
  });
});
