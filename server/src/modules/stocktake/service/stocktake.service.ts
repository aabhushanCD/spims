import mongoose from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import { buildPage, decodeCursor } from "../../../shared/pagination/cursor.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { StockMutationService } from "../../inventory/services/stockMutation.service.ts";
import type { CounterRepository } from "../../sales/repo/counter.repo.ts";
import type { StocktakeRepo } from "../repo/stocktake.repo.ts";
import type {
  CreateStocktakeDto,
  StocktakeListQuery,
  UpdateStocktakeDto,
} from "../schema/stocktake.schema.ts";
import type { StocktakeItem } from "../model/stocktake.model.ts";

export class StocktakeService {
  constructor(
    private readonly stocktakeRepo: StocktakeRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly stockMutation: StockMutationService,
    private readonly counterRepo: CounterRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

  private async buildItems(
    items: CreateStocktakeDto["items"],
    session?: mongoose.ClientSession,
  ): Promise<StocktakeItem[]> {
    const result: StocktakeItem[] = [];
    for (const item of items) {
      const batch = await this.batchRepo.findById(item.batchId, session);
      if (!batch) {
        throw this.appError.notFound("Batch not found");
      }
      result.push({
        batchId: batch._id,
        medicineId: batch.medicineId,
        systemQuantity: batch.quantityRemaining,
        countedQuantity: item.countedQuantity,
        variance: item.countedQuantity - batch.quantityRemaining,
        ...(item.remarks ? { remarks: item.remarks } : {}),
      });
    }
    return result;
  }

  async create(dto: CreateStocktakeDto, performedBy: string) {
    const session = await this.connection.startSession();
    try {
      let created: Awaited<ReturnType<StocktakeRepo["create"]>> | undefined;
      await session.withTransaction(async () => {
        const items = await this.buildItems(dto.items, session);
        const stocktakeNumber =
          await this.counterRepo.generateStocktakeNumber(session);
        created = await this.stocktakeRepo.create(
          {
            stocktakeNumber,
            status: "IN_PROGRESS",
            startedBy: new mongoose.Types.ObjectId(performedBy),
            notes: dto.notes ?? null,
            items,
          },
          session,
        );
      });
      return created;
    } finally {
      await session.endSession();
    }
  }

  async getById(id: string) {
    const doc = await this.stocktakeRepo.findById(id);
    if (!doc) {
      throw this.appError.notFound("Stocktake not found");
    }
    return doc;
  }

  async getPage(query: StocktakeListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.stocktakeRepo.findPage(
      { ...(query.status ? { status: query.status } : {}) },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }

  async update(id: string, dto: UpdateStocktakeDto) {
    const existing = await this.stocktakeRepo.findByIdRaw(id);
    if (!existing) {
      throw this.appError.notFound("Stocktake not found");
    }
    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      throw this.appError.conflict("Completed/cancelled stocktakes are read-only");
    }
    const items = dto.items ? await this.buildItems(dto.items) : existing.items;
    return await this.stocktakeRepo.update(id, {
      items,
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    });
  }

  async complete(id: string, performedBy: string) {
    const session = await this.connection.startSession();
    try {
      let completed: Awaited<ReturnType<StocktakeRepo["update"]>> | undefined;
      await session.withTransaction(async () => {
        const existing = await this.stocktakeRepo.findByIdRaw(id, session);
        if (!existing) {
          throw this.appError.notFound("Stocktake not found");
        }
        if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
          throw this.appError.conflict("Stocktake is already closed");
        }

        for (const item of existing.items) {
          if (item.variance === 0) {
            continue;
          }
          await this.stockMutation.setBatchStock({
            medicineId: item.medicineId.toString(),
            batchId: item.batchId.toString(),
            newQuantity: item.countedQuantity,
            ctx: {
              medicineId: item.medicineId.toString(),
              batchId: item.batchId.toString(),
              movementType: "ADJUSTMENT",
              referenceType: "ADJUSTMENT",
              referenceId: id,
              performedBy,
              remarks: `Stocktake ${existing.stocktakeNumber}`,
            },
            session,
          });
        }

        completed = await this.stocktakeRepo.update(
          id,
          {
            status: "COMPLETED",
            completedBy: new mongoose.Types.ObjectId(performedBy),
            completedAt: new Date(),
          },
          session,
        );
      });
      return completed;
    } finally {
      await session.endSession();
    }
  }

  async cancel(id: string) {
    const existing = await this.stocktakeRepo.findByIdRaw(id);
    if (!existing) {
      throw this.appError.notFound("Stocktake not found");
    }
    if (existing.status === "COMPLETED") {
      throw this.appError.conflict("Completed stocktakes cannot be cancelled");
    }
    return await this.stocktakeRepo.update(id, { status: "CANCELLED" });
  }
}
