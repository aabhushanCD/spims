import { beforeEach, describe, expect, it, vi } from "vitest";

import { StocktakeService } from "./stocktake.service.ts";
import { AppError } from "../../../shared/error.ts";

const BATCH_ID = "507f1f77bcf86cd799439011";
const MEDICINE_ID = "507f1f77bcf86cd799439021";
const USER_ID = "507f1f77bcf86cd799439031";
const STOCKTAKE_ID = "507f1f77bcf86cd799439041";

function buildService() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };
  const connection = {
    startSession: vi.fn().mockResolvedValue(session),
  };
  const stocktakeRepo = {
    create: vi.fn().mockImplementation(async (data) => data),
    findById: vi.fn(),
    findByIdRaw: vi.fn(),
    findPage: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (_id, data) => data),
  };
  const batchRepo = {
    findById: vi.fn().mockResolvedValue({
      _id: { toString: () => BATCH_ID },
      medicineId: { toString: () => MEDICINE_ID },
      quantityRemaining: 7,
    }),
  };
  const stockMutation = {
    setBatchStock: vi.fn().mockResolvedValue({}),
  };
  const counterRepo = {
    generateStocktakeNumber: vi.fn().mockResolvedValue("ST-000001"),
  };
  const service = new StocktakeService(
    stocktakeRepo as never,
    batchRepo as never,
    stockMutation as never,
    counterRepo as never,
    AppError,
    connection as never,
  );
  return {
    service,
    session,
    stocktakeRepo,
    batchRepo,
    stockMutation,
    counterRepo,
  };
}

describe("StocktakeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an in-progress stocktake with system quantities and variances", async () => {
    const { service, stocktakeRepo } = buildService();

    await service.create(
      { items: [{ batchId: BATCH_ID, countedQuantity: 5 }] },
      USER_ID,
    );

    expect(stocktakeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stocktakeNumber: "ST-000001",
        status: "IN_PROGRESS",
        items: [
          expect.objectContaining({
            systemQuantity: 7,
            countedQuantity: 5,
            variance: -2,
          }),
        ],
      }),
      expect.anything(),
    );
  });

  it("applies counted quantities on completion", async () => {
    const { service, stocktakeRepo, stockMutation } = buildService();
    stocktakeRepo.findByIdRaw.mockResolvedValue({
      _id: { toString: () => STOCKTAKE_ID },
      stocktakeNumber: "ST-000001",
      status: "IN_PROGRESS",
      items: [
        {
          batchId: { toString: () => BATCH_ID },
          medicineId: { toString: () => MEDICINE_ID },
          systemQuantity: 7,
          countedQuantity: 5,
          variance: -2,
        },
      ],
    });

    await service.complete(STOCKTAKE_ID, USER_ID);

    expect(stockMutation.setBatchStock).toHaveBeenCalledWith(
      expect.objectContaining({
        medicineId: MEDICINE_ID,
        batchId: BATCH_ID,
        newQuantity: 5,
      }),
    );
    expect(stocktakeRepo.update).toHaveBeenCalledWith(
      STOCKTAKE_ID,
      expect.objectContaining({ status: "COMPLETED" }),
      expect.anything(),
    );
  });

  it("rejects completion of a closed stocktake", async () => {
    const { service, stocktakeRepo } = buildService();
    stocktakeRepo.findByIdRaw.mockResolvedValue({
      _id: STOCKTAKE_ID,
      status: "COMPLETED",
      items: [],
    });

    await expect(
      service.complete(STOCKTAKE_ID, USER_ID),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
