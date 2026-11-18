import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderService } from "./purchaseOrder.service.ts";
import { AppError } from "../../../shared/error.ts";

const PURCHASE_ORDER_ID = "507f1f77bcf86cd799439071";
const MEDICINE_ID = "507f1f77bcf86cd799439011";

function buildService() {
  const purchaseOrderRepo = {
    findById: vi.fn(),
    findByIdWithSupplier: vi.fn(),
    findAll: vi.fn(),
    findBySupplierId: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn(),
  };
  const supplierRepo = {
    findById: vi.fn(),
  };
  const purchaseOrderItemRepo = {
    create: vi.fn(),
    findById: vi.fn(),
    findByPurchaseOrderId: vi.fn(),
    findByPurchaseOrderAndMedicine: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const inventoryService = { syncInventoryFromBatch: vi.fn() };
  const inventoryMovementService = {};
  const batchService = { createBatch: vi.fn() };
  const userRepo = { findById: vi.fn() };

  const service = new PurchaseOrderService(
    purchaseOrderRepo as never,
    supplierRepo as never,
    purchaseOrderItemRepo as never,
    inventoryService as never,
    inventoryMovementService as never,
    batchService as never,
    userRepo as never,
    AppError,
  );

  return {
    service,
    purchaseOrderRepo,
    purchaseOrderItemRepo,
    supplierRepo,
  };
}

describe("PurchaseOrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("approvePurchaseOrder", () => {
    it("approves a pending order that has items", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { _id: "item-1" },
      ]);

      await service.approvePurchaseOrder(PURCHASE_ORDER_ID);

      expect(purchaseOrderRepo.update).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        { status: "approved" },
      );
    });

    it("rejects an unknown purchase order", async () => {
      const { service, purchaseOrderRepo } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.approvePurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Purchase order not found",
        statusCode: 404,
      });
    });

    it("rejects orders that are not pending", async () => {
      const { service, purchaseOrderRepo } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "received",
      });

      await expect(
        service.approvePurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Only pending purchase orders can be approved",
        statusCode: 400,
      });
    });

    it("rejects an order with no items", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([]);

      await expect(
        service.approvePurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Cannot approve a purchase order with no items",
        statusCode: 400,
      });
    });
  });

  describe("cancelPurchaseOrder", () => {
    it("cancels a non-received order", async () => {
      const { service, purchaseOrderRepo } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
      });

      await service.cancelPurchaseOrder(PURCHASE_ORDER_ID);

      expect(purchaseOrderRepo.update).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        { status: "cancelled" },
      );
    });

    it("rejects cancelling a received order", async () => {
      const { service, purchaseOrderRepo } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "received",
      });

      await expect(
        service.cancelPurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Received purchase orders cannot be cancelled",
        statusCode: 400,
      });
      expect(purchaseOrderRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("addPurchaseOrderItem", () => {
    it("rejects a medicine that is already on the order", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
      });
      purchaseOrderItemRepo.findByPurchaseOrderAndMedicine.mockResolvedValue({
        _id: "existing-item",
      });

      await expect(
        service.addPurchaseOrderItem(PURCHASE_ORDER_ID, {
          purchaseOrderId: PURCHASE_ORDER_ID,
          medicineId: MEDICINE_ID,
          quantity: 1,
          purchasePrice: 10,
        }),
      ).rejects.toMatchObject({
        message: "Medicine already exists in the purchase order",
        statusCode: 400,
      });
    });

    it("rejects changes to a non-pending order", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "approved",
      });
      purchaseOrderItemRepo.findByPurchaseOrderAndMedicine.mockResolvedValue(
        null,
      );

      await expect(
        service.addPurchaseOrderItem(PURCHASE_ORDER_ID, {
          purchaseOrderId: PURCHASE_ORDER_ID,
          medicineId: MEDICINE_ID,
          quantity: 1,
          purchasePrice: 10,
        }),
      ).rejects.toMatchObject({
        message: "Items can only be added to pending purchase orders",
        statusCode: 400,
      });
    });
  });

  describe("recalculateTotals", () => {
    it("sums quantity multiplied by purchase price", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { quantity: 2, purchasePrice: 10 },
        { quantity: 3, purchasePrice: 5.5 },
      ]);

      await expect(
        service.recalculateTotals(PURCHASE_ORDER_ID),
      ).resolves.toBe(36.5);
    });
  });
});
