import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnService, type CreateReturnDto } from "./return.service.ts";
import { AppError } from "../../../shared/error.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";
const SALE_ID = "507f1f77bcf86cd799439041";
const SALE_ITEM_ID = "507f1f77bcf86cd799439051";
const USER_ID = "507f1f77bcf86cd799439031";
const RETURN_ID = "507f1f77bcf86cd799439061";

const saleDate = new Date("2026-01-01T10:00:00Z");

function buildSaleItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => SALE_ITEM_ID },
    quantity: 10,
    returnedQuantity: 2,
    unitPrice: 100,
    discount: 50,
    medicineId: { toString: () => MEDICINE_ID },
    batchId: { toString: () => BATCH_ID },
    ...overrides,
  };
}

function buildDto(overrides: Partial<CreateReturnDto> = {}): CreateReturnDto {
  return {
    salesId: SALE_ID,
    returnReason: "Customer changed mind",
    returnedBy: USER_ID,
    returnDate: "2026-01-02T10:00:00Z",
    performedBy: USER_ID,
    items: [
      {
        saleItemId: SALE_ITEM_ID,
        quantity: 3,
        condition: "GOOD",
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

  const returnRepo = {
    create: vi.fn().mockResolvedValue({
      _id: { toString: () => RETURN_ID },
    }),
    update: vi.fn().mockResolvedValue({}),
    findById: vi.fn().mockResolvedValue({ _id: RETURN_ID }),
    findAll: vi.fn(),
    delete: vi.fn(),
  };
  const saleItemRepo = {
    findBySalesId: vi.fn().mockResolvedValue([buildSaleItem()]),
    update: vi.fn().mockResolvedValue({}),
  };
  const salesRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => SALE_ID },
      saleDate,
    }),
    update: vi.fn().mockResolvedValue({}),
  };
  const inventoryService = {
    returnMedicine: vi.fn().mockResolvedValue({}),
  };
  const counterRepo = {
    generateReturnNumber: vi.fn().mockResolvedValue("RET-000001"),
  };

  const service = new ReturnService(
    returnRepo as never,
    saleItemRepo as never,
    salesRepo as never,
    inventoryService as never,
    AppError,
    counterRepo as never,
    connection as never,
  );

  return {
    service,
    connection,
    returnRepo,
    saleItemRepo,
    salesRepo,
    inventoryService,
  };
}

describe("ReturnService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an empty return before opening a transaction", async () => {
    const { service, connection } = buildService();

    await expect(
      service.createReturn(buildDto({ items: [] })),
    ).rejects.toMatchObject({
      message: "Return must contain at least one item",
      statusCode: 400,
    });
    expect(connection.startSession).not.toHaveBeenCalled();
  });

  it("rejects a return for an unknown sale", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.findById.mockResolvedValue(null);

    await expect(service.createReturn(buildDto())).rejects.toMatchObject({
      message: "Sale not found",
      statusCode: 404,
    });
  });

  it("rejects a return date before the sale date", async () => {
    const { service } = buildService();

    await expect(
      service.createReturn(buildDto({ returnDate: "2025-12-31T10:00:00Z" })),
    ).rejects.toMatchObject({
      message: "Return date cannot be before sale date",
      statusCode: 400,
    });
  });

  it("rejects returning more than the unreturned quantity", async () => {
    const { service, inventoryService } = buildService();

    await expect(
      service.createReturn(
        buildDto({
          items: [
            {
              saleItemId: SALE_ITEM_ID,
              quantity: 9,
              condition: "GOOD",
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      message: "Only 8 items can be returned.",
      statusCode: 400,
    });
    expect(inventoryService.returnMedicine).not.toHaveBeenCalled();
  });

  it("rejects a sale item that does not belong to the sale", async () => {
    const { service } = buildService();

    await expect(
      service.createReturn(
        buildDto({
          items: [
            {
              saleItemId: "507f1f77bcf86cd799439999",
              quantity: 1,
              condition: "GOOD",
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      message: "Invalid Sale Item",
      statusCode: 400,
    });
  });

  it("calculates the refund net of the original line discount", async () => {
    const { service, returnRepo, saleItemRepo, salesRepo, inventoryService } =
      buildService();

    await service.createReturn(buildDto());

    // 3 units * 100 = 300, minus (50 discount / 10 units) * 3 = 15
    expect(inventoryService.returnMedicine).toHaveBeenCalledWith(
      MEDICINE_ID,
      BATCH_ID,
      3,
      "GOOD",
      expect.objectContaining({
        referenceId: RETURN_ID,
        referenceType: "SALES_RETURN",
        movementType: "RETURN",
        performedBy: USER_ID,
      }),
      expect.anything(),
    );
    expect(returnRepo.update).toHaveBeenCalledWith(
      RETURN_ID,
      expect.objectContaining({
        refundAmount: 285,
        status: "COMPLETED",
        returnItems: [
          expect.objectContaining({
            saleItemId: expect.anything(),
            quantity: 3,
            refundAmount: 285,
            condition: "GOOD",
          }),
        ],
      }),
      expect.anything(),
    );
    expect(saleItemRepo.update).toHaveBeenCalledWith(
      SALE_ITEM_ID,
      { returnedQuantity: 5 },
      expect.anything(),
    );
    expect(salesRepo.update).toHaveBeenCalledWith(
      SALE_ID,
      { status: "PARTIALLY_RETURNED" },
      expect.anything(),
    );
  });

  it("marks the sale as fully returned when all quantities are returned", async () => {
    const { service, saleItemRepo, salesRepo } = buildService();
    saleItemRepo.findBySalesId.mockResolvedValue([
      buildSaleItem({ returnedQuantity: 7 }),
    ]);

    await service.createReturn(buildDto());

    expect(salesRepo.update).toHaveBeenCalledWith(
      SALE_ID,
      { status: "RETURNED" },
      expect.anything(),
    );
  });

  it("merges duplicate return lines into a single stock movement", async () => {
    const { service, inventoryService } = buildService();

    await service.createReturn(
      buildDto({
        items: [
          { saleItemId: SALE_ITEM_ID, quantity: 1, condition: "GOOD" },
          { saleItemId: SALE_ITEM_ID, quantity: 2, condition: "GOOD" },
        ],
      }),
    );

    expect(inventoryService.returnMedicine).toHaveBeenCalledTimes(1);
    expect(inventoryService.returnMedicine).toHaveBeenCalledWith(
      MEDICINE_ID,
      BATCH_ID,
      3,
      "GOOD",
      expect.anything(),
      expect.anything(),
    );
  });

  it("passes the return condition through to inventory", async () => {
    const { service, inventoryService } = buildService();

    await service.createReturn(
      buildDto({
        items: [
          {
            saleItemId: SALE_ITEM_ID,
            quantity: 1,
            condition: "DAMAGED",
          },
        ],
      }),
    );

    expect(inventoryService.returnMedicine).toHaveBeenCalledWith(
      MEDICINE_ID,
      BATCH_ID,
      1,
      "DAMAGED",
      expect.anything(),
      expect.anything(),
    );
  });
});
