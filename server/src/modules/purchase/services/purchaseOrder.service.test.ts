import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderService } from "./purchaseOrder.service.ts";
import { AppError } from "../../../shared/error.ts";

const PURCHASE_ORDER_ID = "507f1f77bcf86cd799439071";
const MEDICINE_ID = "507f1f77bcf86cd799439011";
const USER_ID = "507f1f77bcf86cd799439031";

function buildService() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = { startSession: vi.fn().mockResolvedValue(session) };

  const purchaseOrderRepo = {
    findById: vi.fn(),
    findByIdWithSupplier: vi.fn(),
    findAll: vi.fn(),
    findBySupplierId: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn(),
  };
  const supplierRepo = { findById: vi.fn() };
  const purchaseOrderItemRepo = {
    create: vi.fn(),
    findById: vi.fn(),
    findByPurchaseOrderId: vi.fn(),
    findByPurchaseOrderAndMedicine: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const batchService = { createBatch: vi.fn() };
  const userRepo = { findById: vi.fn() };

  const service = new PurchaseOrderService(
    purchaseOrderRepo as never,
    supplierRepo as never,
    purchaseOrderItemRepo as never,
    batchService as never,
    userRepo as never,
    AppError,
    connection as never,
  );

  return {
    service,
    session,
    connection,
    purchaseOrderRepo,
    purchaseOrderItemRepo,
    supplierRepo,
    batchService,
    userRepo,
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

  describe("receivePurchaseOrder", () => {
    function prepareReceive(build: ReturnType<typeof buildService>) {
      build.userRepo.findById.mockResolvedValue({ _id: USER_ID });
      build.purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "approved",
        invoiceNumber: "PO-000001",
      });
      build.purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        {
          _id: "item-1",
          medicineId: { _id: { toString: () => MEDICINE_ID } },
          quantity: 5,
          purchasePrice: 10,
        },
      ]);
      build.batchService.createBatch.mockResolvedValue({
        _id: { toString: () => "batch-1" },
      });
    }

    it("creates the batch with a movement context and no separate sync", async () => {
      const build = buildService();
      prepareReceive(build);

      const result = await build.service.receivePurchaseOrder(
        PURCHASE_ORDER_ID,
        {
          items: [
            {
              medicineId: MEDICINE_ID,
              batchNumber: "B-1",
              manufacturingDate: "2026-01-01",
              expiryDate: "2027-01-01",
              quantityReceived: 5,
              sellingPrice: 15,
            },
          ],
        } as never,
        USER_ID,
      );

      expect(build.batchService.createBatch).toHaveBeenCalledTimes(1);
      expect(build.batchService.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          medicineId: MEDICINE_ID,
          purchaseOrderId: PURCHASE_ORDER_ID,
          quantityReceived: 5,
          quantityRemaining: 5,
        }),
        expect.anything(),
        {
          referenceId: PURCHASE_ORDER_ID,
          referenceType: "PURCHASE_ORDER",
          movementType: "PURCHASE",
          performedBy: USER_ID,
          remarks: "Received from PO PO-000001",
        },
      );
      expect(build.purchaseOrderRepo.update).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        expect.objectContaining({ status: "received" }),
        expect.anything(),
      );
      expect(build.session.endSession).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: "Purchase order received successfully" });
    });

    it("rejects receiving an unapproved order", async () => {
      const build = buildService();
      build.userRepo.findById.mockResolvedValue({ _id: USER_ID });
      build.purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
        invoiceNumber: "PO-000001",
      });

      await expect(
        build.service.receivePurchaseOrder(
          PURCHASE_ORDER_ID,
          { items: [] } as never,
          USER_ID,
        ),
      ).rejects.toMatchObject({
        message: "Only approved purchase orders can be received",
        statusCode: 400,
      });
      expect(build.session.endSession).toHaveBeenCalledTimes(1);
    });
  });
});
