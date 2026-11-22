import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderService } from "./purchaseOrder.service.ts";
import { AppError } from "../../../shared/error.ts";

const PURCHASE_ORDER_ID = "507f1f77bcf86cd799439071";
const MEDICINE_ID = "507f1f77bcf86cd799439011";
const OTHER_MEDICINE_ID = "507f1f77bcf86cd799439012";
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
  const batchService = {
    createBatch: vi.fn(),
    hasBatchesForPurchaseOrder: vi.fn().mockResolvedValue(false),
  };
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
    it("applies VAT and discount, persists the total, and returns the breakdown", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        discount: 6.5,
        VAT: 13,
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { quantity: 2, purchasePrice: 10 },
        { quantity: 3, purchasePrice: 5.5 },
      ]);

      await expect(
        service.recalculateTotals(PURCHASE_ORDER_ID),
      ).resolves.toEqual({
        subtotal: 36.5,
        discount: 6.5,
        taxable: 30,
        vatAmount: 3.9,
        totalAmount: 33.9,
      });

      expect(purchaseOrderRepo.update).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        { totalAmount: 33.9 },
        undefined,
      );
    });

    it("rejects a discount larger than the subtotal", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        discount: 100,
        VAT: 13,
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { quantity: 1, purchasePrice: 10 },
      ]);

      await expect(
        service.recalculateTotals(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Discount exceeds subtotal",
        statusCode: 400,
      });
      expect(purchaseOrderRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("getPurchaseOrderById", () => {
    it("returns received and remaining quantities for each item", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findByIdWithSupplier.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        supplierId: { _id: "supplier-1", companyName: "Supplier" },
        orderDate: new Date("2026-01-01"),
        invoiceNumber: "PO-000001",
        invoiceFile: "",
        totalAmount: 50,
        status: "partially_received",
        VAT: 13,
        discount: 0,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        {
          _id: "item-1",
          medicineId: {
            _id: MEDICINE_ID,
            medicineName: "Paracetamol",
          },
          quantity: 10,
          receivedQuantity: 4,
          purchasePrice: 5,
        },
        {
          _id: "item-2",
          medicineId: {
            _id: OTHER_MEDICINE_ID,
            medicineName: "Ibuprofen",
          },
          quantity: 3,
          purchasePrice: 2,
        },
      ]);

      const result = await service.getPurchaseOrderById(PURCHASE_ORDER_ID);

      expect(result.items).toEqual([
        expect.objectContaining({
          _id: "item-1",
          quantity: 10,
          receivedQuantity: 4,
          quantityRemaining: 6,
        }),
        expect.objectContaining({
          _id: "item-2",
          quantity: 3,
          receivedQuantity: 0,
          quantityRemaining: 3,
        }),
      ]);
    });
  });

  describe("createPurchaseOrder", () => {
    const baseOrder = {
      supplierId: "507f1f77bcf86cd799439081",
      orderDate: new Date("2026-01-01"),
      invoiceNumber: "INV-1",
      invoiceFile: "",
      discount: 6.5,
      VAT: 13,
      items: [
        { medicineId: MEDICINE_ID, quantity: 2, purchasePrice: 10 },
        { medicineId: OTHER_MEDICINE_ID, quantity: 3, purchasePrice: 5.5 },
      ],
    };

    it("always starts pending and persists a VAT/discount-aware total", async () => {
      const { service, supplierRepo, purchaseOrderRepo } = buildService();
      supplierRepo.findById.mockResolvedValue({ _id: "supplier-1" });
      purchaseOrderRepo.create.mockResolvedValue({
        _id: { toString: () => PURCHASE_ORDER_ID },
      });

      await service.createPurchaseOrder({
        ...baseOrder,
        status: "received",
      } as never);

      expect(purchaseOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
          totalAmount: 33.9,
        }),
        expect.anything(),
      );
    });

    it("rejects a discount larger than the subtotal", async () => {
      const { service, supplierRepo, purchaseOrderRepo } = buildService();
      supplierRepo.findById.mockResolvedValue({ _id: "supplier-1" });

      await expect(
        service.createPurchaseOrder({
          ...baseOrder,
          discount: 100,
        } as never),
      ).rejects.toMatchObject({
        message: "Discount exceeds subtotal",
        statusCode: 400,
      });
      expect(purchaseOrderRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("deletePurchaseOrder", () => {
    it("blocks deletion of a received order", async () => {
      const { service, purchaseOrderRepo, batchService } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "received",
      });

      await expect(
        service.deletePurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Received purchase orders cannot be deleted",
        statusCode: 409,
      });
      expect(batchService.hasBatchesForPurchaseOrder).not.toHaveBeenCalled();
      expect(purchaseOrderRepo.delete).not.toHaveBeenCalled();
    });

    it("blocks deletion when batches already reference the order", async () => {
      const { service, purchaseOrderRepo, batchService } = buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "approved",
      });
      batchService.hasBatchesForPurchaseOrder.mockResolvedValue(true);

      await expect(
        service.deletePurchaseOrder(PURCHASE_ORDER_ID),
      ).rejects.toMatchObject({
        message: "Cannot delete a purchase order with received batches",
        statusCode: 409,
      });
      expect(purchaseOrderRepo.delete).not.toHaveBeenCalled();
    });

    it("cascades item deletion for a deletable order", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
      });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { _id: { toString: () => "item-1" } },
        { _id: { toString: () => "item-2" } },
      ]);
      purchaseOrderRepo.delete.mockResolvedValue({ _id: PURCHASE_ORDER_ID });

      await service.deletePurchaseOrder(PURCHASE_ORDER_ID);

      expect(purchaseOrderItemRepo.delete).toHaveBeenCalledWith(
        "item-1",
        expect.anything(),
      );
      expect(purchaseOrderItemRepo.delete).toHaveBeenCalledWith(
        "item-2",
        expect.anything(),
      );
      expect(purchaseOrderRepo.delete).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        expect.anything(),
      );
    });
  });

  describe("updatePurchaseOrderItem", () => {
    it("persists recalculated totals after an item update", async () => {
      const { service, purchaseOrderRepo, purchaseOrderItemRepo } =
        buildService();
      purchaseOrderRepo.findById.mockResolvedValue({
        _id: PURCHASE_ORDER_ID,
        status: "pending",
        discount: 0,
        VAT: 13,
      });
      purchaseOrderItemRepo.findById.mockResolvedValue({
        _id: { toString: () => "item-1" },
        purchaseOrderId: { toString: () => PURCHASE_ORDER_ID },
      });
      purchaseOrderItemRepo.update.mockResolvedValue({ _id: "item-1" });
      purchaseOrderItemRepo.findByPurchaseOrderId.mockResolvedValue([
        { quantity: 2, purchasePrice: 10 },
      ]);

      await service.updatePurchaseOrderItem(
        PURCHASE_ORDER_ID,
        "item-1",
        { quantity: 2 },
      );

      expect(purchaseOrderRepo.update).toHaveBeenCalledWith(
        PURCHASE_ORDER_ID,
        { totalAmount: 22.6 },
        expect.anything(),
      );
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
        message:
          "Only approved or partially received purchase orders can be received",
        statusCode: 400,
      });
      expect(build.session.endSession).toHaveBeenCalledTimes(1);
    });
  });
});
