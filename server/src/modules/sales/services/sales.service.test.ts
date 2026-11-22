import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalesService } from "./sales.service.ts";
import { AppError } from "../../../shared/error.ts";
import type { CreateSaleDto } from "../schema/sales.schema.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const BATCH_2_ID = "507f1f77bcf86cd799439022";
const USER_ID = "507f1f77bcf86cd799439031";
const SALE_ID = "507f1f77bcf86cd799439041";

const saleDate = new Date("2026-01-01T10:00:00Z");

function buildDto(overrides: Partial<CreateSaleDto> = {}): CreateSaleDto {
  return {
    cashierId: USER_ID,
    customerName: "Walk-in customer",
    paymentMethod: "CASH",
    saleDate,
    discount: 0,
    items: [
      {
        batchId: BATCH_ID,
        medicineId: MEDICINE_ID,
        quantity: 1,
        discountPercentage: 0,
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

  const salesRepo = {
    create: vi.fn().mockResolvedValue({
      _id: { toString: () => SALE_ID },
    }),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue({ _id: SALE_ID }),
    findAll: vi.fn(),
    delete: vi.fn(),
  };
  const saleItemRepo = {
    create: vi.fn().mockResolvedValue({}),
    findBySalesId: vi.fn(),
    delete: vi.fn(),
  };
  const inventoryService = {
    sellMedicine: vi.fn(),
    increaseStock: vi.fn(),
  };
  const batchRepo = {};
  const counterRepo = {
    generateInvoiceNumber: vi.fn().mockResolvedValue("INV-000001"),
  };
  const returnRepo = {
    hasActiveBySale: vi.fn().mockResolvedValue(false),
  };
  const paymentService = {
    recordSalePayment: vi.fn().mockResolvedValue({}),
  };
  const customerRepo = {
    findById: vi.fn(),
  };

  const service = new SalesService(
    salesRepo as never,
    saleItemRepo as never,
    inventoryService as never,
    batchRepo as never,
    counterRepo as never,
    returnRepo as never,
    AppError,
    connection as never,
    undefined,
    paymentService as never,
    customerRepo as never,
  );

  return {
    service,
    session,
    connection,
    salesRepo,
    saleItemRepo,
    inventoryService,
    counterRepo,
    returnRepo,
    paymentService,
    customerRepo,
  };
}

describe("SalesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSale", () => {
    it("rejects an empty cart before opening a transaction", async () => {
      const { service, connection } = buildService();

      await expect(
        service.createSale(buildDto({ items: [] })),
      ).rejects.toMatchObject({
        message: "Cart is empty",
        statusCode: 400,
      });
      expect(connection.startSession).not.toHaveBeenCalled();
    });

    it("records a full payment for non-credit sales", async () => {
      const { service, inventoryService, paymentService } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(buildDto());

      expect(paymentService.recordSalePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 113,
          method: "CASH",
          performedBy: USER_ID,
        }),
        expect.anything(),
      );
    });

    it("leaves CREDIT sales unpaid until a payment is recorded", async () => {
      const { service, inventoryService, paymentService } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(buildDto({ paymentMethod: "CREDIT" }));

      expect(paymentService.recordSalePayment).not.toHaveBeenCalled();
    });

    it("uses the customer name snapshot when customerId is supplied", async () => {
      const { service, inventoryService, customerRepo, salesRepo } =
        buildService();
      customerRepo.findById.mockResolvedValue({
        _id: { toString: () => "507f1f77bcf86cd799439071" },
        name: "Registered Customer",
        isActive: true,
      });
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(
        buildDto({
          customerId: "507f1f77bcf86cd799439071",
          customerName: "",
        }),
      );

      expect(salesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "Registered Customer",
          customerId: expect.anything(),
        }),
        expect.anything(),
      );
    });

    it("rejects an unknown or inactive customer", async () => {
      const { service, customerRepo, connection } = buildService();
      customerRepo.findById.mockResolvedValue(null);

      await expect(
        service.createSale(
          buildDto({ customerId: "507f1f77bcf86cd799439071" }),
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(connection.startSession).not.toHaveBeenCalled();
    });

    it("merges duplicate medicine lines and keeps the highest discount", async () => {
      const { service, inventoryService, saleItemRepo } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 5,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(
        buildDto({
          items: [
            {
              batchId: BATCH_ID,
              medicineId: MEDICINE_ID,
              quantity: 2,
              discountPercentage: 5,
            },
            {
              batchId: BATCH_ID,
              medicineId: MEDICINE_ID,
              quantity: 3,
              discountPercentage: 10,
            },
          ],
        }),
      );

      expect(inventoryService.sellMedicine).toHaveBeenCalledTimes(1);
      expect(inventoryService.sellMedicine).toHaveBeenCalledWith(
        MEDICINE_ID,
        5,
        expect.objectContaining({
          referenceId: SALE_ID,
          referenceType: "SALE",
          movementType: "SALE",
          performedBy: USER_ID,
        }),
        expect.anything(),
      );
      expect(saleItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 5,
          discount: 50,
          totalPrice: 450,
        }),
        expect.anything(),
      );
    });

    it("calculates line discounts, invoice discount, VAT, and total", async () => {
      const { service, inventoryService, saleItemRepo, salesRepo } =
        buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 2,
          unitPrice: 100,
          purchasePrice: 60,
        },
        {
          batchId: BATCH_2_ID,
          batchNumber: "B-2",
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 50,
          purchasePrice: 30,
        },
      ]);

      await service.createSale(
        buildDto({
          discount: 10,
          items: [
            {
              batchId: BATCH_ID,
              medicineId: MEDICINE_ID,
              quantity: 3,
              discountPercentage: 10,
            },
          ],
        }),
      );

      expect(saleItemRepo.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ discount: 20, totalPrice: 180 }),
        expect.anything(),
      );
      expect(saleItemRepo.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ discount: 5, totalPrice: 45 }),
        expect.anything(),
      );
      // Cost is snapshotted onto the sale item for stable historical COGS.
      expect(saleItemRepo.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ purchasePrice: 60 }),
        expect.anything(),
      );
      expect(saleItemRepo.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ purchasePrice: 30 }),
        expect.anything(),
      );

      // subtotal 250, line discount 25, invoice discount 10
      // taxable 215, VAT 13% = 27.95, total = 242.95
      expect(salesRepo.update).toHaveBeenCalledWith(
        SALE_ID,
        {
          subTotal: 250,
          discount: 35,
          VAT: 27.95,
          totalAmount: 242.95,
        },
        expect.anything(),
      );
    });

    it("rounds VAT to two decimal places", async () => {
      const { service, inventoryService, salesRepo } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 99.99,
          purchasePrice: 70,
        },
      ]);

      await service.createSale(buildDto());

      expect(salesRepo.update).toHaveBeenCalledWith(
        SALE_ID,
        expect.objectContaining({ VAT: 13, totalAmount: 112.99 }),
        expect.anything(),
      );
    });

    it("rejects a negative invoice discount", async () => {
      const { service, inventoryService } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await expect(
        service.createSale(buildDto({ discount: -1 })),
      ).rejects.toMatchObject({
        message: "Invalid discount",
        statusCode: 400,
      });
    });

    it("rejects an invoice discount larger than the discounted subtotal", async () => {
      const { service, inventoryService } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 2,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await expect(
        service.createSale(
          buildDto({
            discount: 181,
            items: [
              {
                batchId: BATCH_ID,
                medicineId: MEDICINE_ID,
                quantity: 2,
                discountPercentage: 10,
              },
            ],
          }),
        ),
      ).rejects.toMatchObject({
        message: "Discount exceeds the discounted subtotal",
        statusCode: 400,
      });
    });

    it("allows an invoice discount equal to the discounted subtotal", async () => {
      const { service, inventoryService, salesRepo } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(buildDto({ discount: 100 }));

      expect(salesRepo.update).toHaveBeenCalledWith(
        SALE_ID,
        expect.objectContaining({ subTotal: 100, totalAmount: 0, VAT: 0 }),
        expect.anything(),
      );
    });

    it("propagates stock allocation failures from the inventory service", async () => {
      const { service, inventoryService, salesRepo } = buildService();
      inventoryService.sellMedicine.mockRejectedValue(
        AppError.badRequest("Only 1 units available."),
      );

      await expect(service.createSale(buildDto())).rejects.toMatchObject({
        message: "Only 1 units available.",
        statusCode: 400,
      });
      expect(salesRepo.update).not.toHaveBeenCalled();
    });

    it("ends the session after a successful sale", async () => {
      const { service, inventoryService, session } = buildService();
      inventoryService.sellMedicine.mockResolvedValue([
        {
          batchId: BATCH_ID,
          batchNumber: "B-1",
          medicineId: MEDICINE_ID,
          quantity: 1,
          unitPrice: 100,
          purchasePrice: 60,
        },
      ]);

      await service.createSale(buildDto());

      expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    it("ends the session when the transaction fails", async () => {
      const { service, salesRepo, session } = buildService();
      salesRepo.create.mockRejectedValueOnce(new Error("database unavailable"));

      await expect(service.createSale(buildDto())).rejects.toThrow(
        "database unavailable",
      );

      expect(session.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteSale", () => {
    it("restores only the unreturned quantity to the original batch", async () => {
      const { service, salesRepo, saleItemRepo, inventoryService } =
        buildService();
      salesRepo.findById.mockResolvedValue({
        _id: SALE_ID,
        invoiceNumber: "INV-000001",
      });
      saleItemRepo.findBySalesId.mockResolvedValue([
        {
          _id: { toString: () => "item-1" },
          medicineId: { toString: () => MEDICINE_ID },
          batchId: { toString: () => BATCH_ID },
          quantity: 5,
          returnedQuantity: 2,
        },
      ]);

      await service.deleteSale(SALE_ID, USER_ID);

      expect(inventoryService.increaseStock).toHaveBeenCalledWith(
        MEDICINE_ID,
        3,
        expect.objectContaining({
          batchId: BATCH_ID,
          referenceId: SALE_ID,
          referenceType: "SALE",
          performedBy: USER_ID,
          movementType: "RETURN",
        }),
        expect.anything(),
      );
      expect(saleItemRepo.delete).toHaveBeenCalledWith(
        "item-1",
        expect.anything(),
      );
      expect(salesRepo.delete).toHaveBeenCalledWith(SALE_ID, expect.anything());
    });

    it("refuses to delete a sale that has returns", async () => {
      const { service, salesRepo, returnRepo, inventoryService } =
        buildService();
      salesRepo.findById.mockResolvedValue({
        _id: SALE_ID,
        invoiceNumber: "INV-000001",
      });
      returnRepo.hasActiveBySale.mockResolvedValue(true);

      await expect(service.deleteSale(SALE_ID, USER_ID)).rejects.toMatchObject({
        message: "Cannot delete a sale with returns; reverse the return first",
        statusCode: 409,
      });
      expect(inventoryService.increaseStock).not.toHaveBeenCalled();
      expect(salesRepo.delete).not.toHaveBeenCalled();
    });

    it("does not restore stock for a fully returned line", async () => {
      const { service, salesRepo, saleItemRepo, inventoryService } =
        buildService();
      salesRepo.findById.mockResolvedValue({
        _id: SALE_ID,
        invoiceNumber: "INV-000001",
      });
      saleItemRepo.findBySalesId.mockResolvedValue([
        {
          _id: { toString: () => "item-1" },
          medicineId: { toString: () => MEDICINE_ID },
          batchId: { toString: () => BATCH_ID },
          quantity: 5,
          returnedQuantity: 5,
        },
      ]);

      await service.deleteSale(SALE_ID, USER_ID);

      expect(inventoryService.increaseStock).not.toHaveBeenCalled();
      expect(saleItemRepo.delete).toHaveBeenCalledTimes(1);
      expect(salesRepo.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("reads and narrow updates", () => {
    it("returns sale and items together", async () => {
      const { service, salesRepo, saleItemRepo } = buildService();
      salesRepo.findById.mockResolvedValue({ _id: SALE_ID });
      saleItemRepo.findBySalesId.mockResolvedValue([{ _id: "item-1" }]);

      await expect(service.getSaleById(SALE_ID)).resolves.toEqual({
        _id: SALE_ID,
        items: [{ _id: "item-1" }],
      });
    });

    it("rejects an unknown sale", async () => {
      const { service, salesRepo } = buildService();
      salesRepo.findById.mockResolvedValue(null);

      await expect(service.getSaleById(SALE_ID)).rejects.toMatchObject({
        message: "Sale not found",
        statusCode: 404,
      });
    });

    it("rejects updating an unknown sale", async () => {
      const { service, salesRepo } = buildService();
      salesRepo.update.mockResolvedValue(null);

      await expect(
        service.updateSale(SALE_ID, { customerName: "New name" }),
      ).rejects.toMatchObject({
        message: "Sale not found",
        statusCode: 404,
      });
    });
  });
});
