import mongoose, { Types } from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import type { IPurchaseOrder } from "../model/purchaseOrder.model.js";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import type { PurchaseOrderRepo } from "../repo/purchaseOrder.repo.ts";
import type { PurchaseOrderItemRepo } from "../repo/purchaseOrderItem.repo.ts";
import type {
  CreatePurchaseOrderDto,
  PurchaseOrderListQuery,
} from "../schema/purchaseOrder.schema.ts";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";
import type {
  CreatePurchaseOrderItemInput,
  UpdatePurchaseOrderItemDto,
} from "../schema/purchaseOrderItem.schema.ts";

import type { BatchService } from "../../batch/service/batch.service.ts";
import type { ReceivePurchaseOrderDto } from "../schema/receivePurchaseOrder.schema.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import {
  computePurchaseTotals,
  type PurchaseTotals,
} from "../utils/purchaseTotals.ts";
import {
  noopCacheInvalidator,
  type CacheInvalidator,
} from "../../../shared/provider/cacheInvalidator.ts";
import { logger } from "../../../shared/logger.ts";
import type { CounterRepository } from "../../sales/repo/counter.repo.ts";

export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly purchaseOrderItemRepo: PurchaseOrderItemRepo,
    private readonly batchService: BatchService,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
    private readonly cacheInvalidator: CacheInvalidator = noopCacheInvalidator,
    private readonly counterRepo?: CounterRepository,
  ) {}

  private async invalidateDashboard(): Promise<void> {
    try {
      await this.cacheInvalidator.invalidateDashboard();
    } catch (error) {
      logger.warn("cache_invalidation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async runInSession<T>(
    session: mongoose.ClientSession | undefined,
    callback: (activeSession: mongoose.ClientSession) => Promise<T>,
  ): Promise<T> {
    if (session) {
      return callback(session);
    }

    const ownedSession = await this.connection.startSession();
    try {
      let result!: T;
      await ownedSession.withTransaction(async () => {
        result = await callback(ownedSession);
      });
      return result;
    } finally {
      await ownedSession.endSession();
    }
  }

  private computeTotals(
    items: Array<{ quantity: number; purchasePrice: number }>,
    discount: number,
    vatPercent: number,
  ): PurchaseTotals {
    if (discount < 0) {
      throw this.appError.badRequest("Discount cannot be negative");
    }
    if (vatPercent < 0 || vatPercent > 100) {
      throw this.appError.badRequest("VAT must be between 0 and 100");
    }

    const totals = computePurchaseTotals({ items, discount, vatPercent });
    if (totals.discount > totals.subtotal) {
      throw this.appError.badRequest("Discount exceeds subtotal");
    }
    return totals;
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDto) {
    const session = await this.connection.startSession();
    try {
      let purchaseOrder!: IPurchaseOrder;
      await session.withTransaction(async () => {
        const supplier = await this.supplierRepo.findById(data.supplierId);

        if (!supplier) {
          throw this.appError.notFound("Supplier not found");
        }

        const {
          items,
          expectedDeliveryDate,
          receivedDate,
          ...purchaseOrderData
        } = data;
        const totals = this.computeTotals(
          items,
          data.discount ?? 0,
          data.VAT ?? 13,
        );

        const orderNumber = this.counterRepo
          ? await this.counterRepo.generatePurchaseOrderNumber(session)
          : undefined;
        const purchaseOrderPayload: Partial<IPurchaseOrder> = {
          ...purchaseOrderData,
          ...(orderNumber ? { orderNumber } : {}),
          supplierId: new Types.ObjectId(data.supplierId),
          // A client-supplied status must never bypass approve/receive.
          status: "pending",
          totalAmount: totals.totalAmount,
          ...(expectedDeliveryDate !== undefined
            ? { expectedDeliveryDate }
            : {}),
          ...(receivedDate !== undefined ? { receivedDate } : {}),
        };

        purchaseOrder = await this.purchaseOrderRepo.create(
          purchaseOrderPayload,
          session,
        );

        for (const item of data.items) {
          await this.purchaseOrderItemRepo.create(
            {
              purchaseOrderId: purchaseOrder._id.toString(),
              vatRate: data.VAT ?? 13,
              ...item,
            },
            session,
          );
        }
      });
      await this.invalidateDashboard();
      return purchaseOrder!;
    } finally {
      await session.endSession();
    }
  }

  // async getPurchaseOrderById(id: string) {
  //   const purchaseOrder = await this.purchaseOrderRepo.findById(id);

  //   if (!purchaseOrder) {
  //     throw this.appError.notFound("Purchase order not found");
  //   }
  //   return purchaseOrder;
  // }

  async getAllPurchaseOrderItems(purchaseOrderId: string) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    return this.purchaseOrderItemRepo.findByPurchaseOrderId(purchaseOrderId);
  }

  async getPurchaseOrders() {
    return this.purchaseOrderRepo.findAll();
  }

  async getPurchaseOrdersPage(query: PurchaseOrderListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.purchaseOrderRepo.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.orderDate,
      (row) => String(row._id),
    );
  }
  async getSupplierPerformance(supplierId: string) {
    const supplier = await this.supplierRepo.findById(supplierId);
    if (!supplier) {
      throw this.appError.notFound("Supplier not found");
    }
    const performance =
      await this.purchaseOrderRepo.getSupplierPerformance(supplierId);
    const recentOrders = await this.purchaseOrderRepo.findRecentBySupplier(
      supplierId,
      10,
    );
    return {
      supplier: {
        _id: supplier._id,
        companyName: supplier.companyName,
        reliabilityScore: supplier.reliabilityScore,
      },
      ...performance,
      onTimeRate:
        performance.receivedOrders > 0
          ? Math.round(
              (performance.onTimeOrders / performance.receivedOrders) * 100,
            )
          : null,
      recentOrders,
    };
  }

  async getPurchaseOrdersBySupplierId(supplierId: string) {
    const supplier = await this.supplierRepo.findById(supplierId);

    if (!supplier) {
      throw this.appError.notFound("Supplier not found");
    }
    return this.purchaseOrderRepo.findBySupplierId(supplierId);
  }
  async getPurchaseOrderById(id: string) {
    const purchase = await this.purchaseOrderRepo.findByIdWithSupplier(id);

    if (!purchase) {
      throw this.appError.notFound("Purchase Order not found");
    }

    const items = await this.purchaseOrderItemRepo.findByPurchaseOrderId(id);

    return {
      _id: purchase._id,

      supplier: purchase.supplierId,

      orderDate: purchase.orderDate,

      expectedDeliveryDate: purchase.expectedDeliveryDate,

      invoiceNumber: purchase.invoiceNumber,

      invoiceFile: purchase.invoiceFile,

      totalAmount: purchase.totalAmount,

      receivedDate: purchase.receivedDate,

      status: purchase.status,

      VAT: purchase.VAT,

      discount: purchase.discount,

      createdAt: purchase.createdAt,

      updatedAt: purchase.updatedAt,

      items: items.map((item) => ({
        _id: item._id,

        medicine: item.medicineId,

        quantity: item.quantity,

        purchasePrice: item.purchasePrice,

        subtotal: item.quantity * item.purchasePrice,
      })),
    };
  }
  async deletePurchaseOrder(id: string) {
    const session = await this.connection.startSession();

    try {
      let deleted = null;

      await session.withTransaction(async () => {
        const existing = await this.purchaseOrderRepo.findById(id, session);

        if (!existing) {
          throw this.appError.notFound("Purchase order not found");
        }
        if (existing.status === "received") {
          throw this.appError.conflict(
            "Received purchase orders cannot be deleted",
          );
        }
        if (await this.batchService.hasBatchesForPurchaseOrder(id)) {
          throw this.appError.conflict(
            "Cannot delete a purchase order with received batches",
          );
        }

        const items =
          await this.purchaseOrderItemRepo.findByPurchaseOrderId(id, session);
        for (const item of items) {
          await this.purchaseOrderItemRepo.delete(
            item._id.toString(),
            session,
          );
        }

        deleted = await this.purchaseOrderRepo.delete(id, session);
      });

      await this.invalidateDashboard();
      return deleted;
    } finally {
      await session.endSession();
    }
  }

  async cancelPurchaseOrder(id: string, performedBy?: string) {
    const existing = await this.purchaseOrderRepo.findById(id);

    if (!existing) {
      throw this.appError.notFound("Purchase order not found");
    }
    if (existing.status === "received") {
      throw this.appError.badRequest(
        "Received purchase orders cannot be cancelled",
      );
    }
    await this.purchaseOrderRepo.update(id, {
      status: "cancelled",
      ...(performedBy
        ? {
            cancelledBy: new Types.ObjectId(performedBy),
            cancelledAt: new Date(),
          }
        : {}),
    });
    await this.invalidateDashboard();
  }

  async addPurchaseOrderItem(
    purchaseOrderId: string,
    data: CreatePurchaseOrderItemInput,
  ) {
    return this.runInSession(undefined, async (session) => {
      const purchaseOrder = await this.purchaseOrderRepo.findById(
        purchaseOrderId,
        session,
      );

      if (!purchaseOrder) {
        throw this.appError.notFound("Purchase order not found");
      }

      const existing =
        await this.purchaseOrderItemRepo.findByPurchaseOrderAndMedicine(
          purchaseOrderId,
          data.medicineId,
          session,
        );
      if (existing) {
        throw this.appError.badRequest(
          "Medicine already exists in the purchase order",
        );
      }

      if (purchaseOrder.status !== "pending") {
        throw this.appError.badRequest(
          "Items can only be added to pending purchase orders",
        );
      }

      const created = await this.purchaseOrderItemRepo.create(
        {
          ...data,
          purchaseOrderId: purchaseOrder._id.toString(),
        },
        session,
      );
      await this.recalculateTotals(purchaseOrderId, session);
      return created;
    }).then(async (created) => {
      await this.invalidateDashboard();
      return created;
    });
  }

  async updatePurchaseOrderItem(
    purchaseOrderId: string,
    itemId: string,
    data: UpdatePurchaseOrderItemDto,
  ) {
    return this.runInSession(undefined, async (session) => {
      const purchaseOrder = await this.purchaseOrderRepo.findById(
        purchaseOrderId,
        session,
      );

      if (!purchaseOrder) {
        throw this.appError.notFound("Purchase order not found");
      }

      if (purchaseOrder.status !== "pending") {
        throw this.appError.badRequest(
          "Items can only be updated in pending purchase orders",
        );
      }
      const existingItem = await this.purchaseOrderItemRepo.findById(
        itemId,
        session,
      );

      if (!existingItem) {
        throw this.appError.notFound("Purchase order item not found");
      }

      if (existingItem.purchaseOrderId.toString() !== purchaseOrderId) {
        throw this.appError.badRequest(
          "Purchase order item does not belong to the specified purchase order",
        );
      }

      const updated = await this.purchaseOrderItemRepo.update(
        itemId,
        data,
        session,
      );
      await this.recalculateTotals(purchaseOrderId, session);
      return updated;
    }).then(async (updated) => {
      await this.invalidateDashboard();
      return updated;
    });
  }

  async removePurchaseOrderItem(purchaseOrderId: string, itemId: string) {
    return this.runInSession(undefined, async (session) => {
      const purchaseOrder = await this.purchaseOrderRepo.findById(
        purchaseOrderId,
        session,
      );

      if (!purchaseOrder) {
        throw this.appError.notFound("Purchase order not found");
      }
      if (purchaseOrder.status !== "pending") {
        throw this.appError.badRequest(
          "Only pending purchase orders can be modified",
        );
      }

      const existingItem = await this.purchaseOrderItemRepo.findById(
        itemId,
        session,
      );

      if (!existingItem) {
        throw this.appError.notFound("Purchase order item not found");
      }

      if (existingItem.purchaseOrderId.toString() !== purchaseOrderId) {
        throw this.appError.badRequest(
          "Purchase order item does not belong to the specified purchase order",
        );
      }
      await this.purchaseOrderItemRepo.delete(itemId, session);
      await this.recalculateTotals(purchaseOrderId, session);
      return existingItem;
    }).then(async (removed) => {
      await this.invalidateDashboard();
      return removed;
    });
  }

  async recalculateTotals(
    purchaseOrderId: string,
    session?: mongoose.ClientSession,
  ): Promise<PurchaseTotals> {
    const purchaseOrder = await this.purchaseOrderRepo.findById(
      purchaseOrderId,
      session,
    );

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    const items = await this.purchaseOrderItemRepo.findByPurchaseOrderId(
      purchaseOrderId,
      session,
    );

    const totals = this.computeTotals(
      items,
      purchaseOrder.discount,
      purchaseOrder.VAT,
    );

    const updated = await this.purchaseOrderRepo.update(
      purchaseOrderId,
      { totalAmount: totals.totalAmount },
      session,
    );
    if (!updated) {
      throw this.appError.conflict(
        "Purchase order changed while recalculating totals",
      );
    }

    return totals;
  }

  async uploadInvoiceFile(purchaseOrderId: string, filePath: string) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    const updated = await this.purchaseOrderRepo.update(purchaseOrderId, {
      invoiceFile: filePath,
    });
    if (!updated) {
      throw this.appError.notFound("Purchase order not found");
    }
    return updated;
  }

  async getInvoiceFile(purchaseOrderId: string): Promise<string> {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    if (!purchaseOrder.invoiceFile) {
      throw this.appError.notFound("Invoice file not uploaded");
    }
    return purchaseOrder.invoiceFile;
  }

  async approvePurchaseOrder(
    purchaseOrderId: string,
    performedBy?: string,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }

    if (purchaseOrder.status !== "pending") {
      throw this.appError.badRequest(
        "Only pending purchase orders can be approved",
      );
    }
    const items =
      await this.purchaseOrderItemRepo.findByPurchaseOrderId(purchaseOrderId);

    if (items.length === 0) {
      throw this.appError.badRequest(
        "Cannot approve a purchase order with no items",
      );
    }

    await this.purchaseOrderRepo.update(purchaseOrderId, {
      status: "approved",
      ...(performedBy
        ? {
            approvedBy: new Types.ObjectId(performedBy),
            approvedAt: new Date(),
          }
        : {}),
    });
    await this.invalidateDashboard();
  }

  async receivePurchaseOrder(
    purchaseOrderId: string,
    data: ReceivePurchaseOrderDto,
    performedBy: string,
  ) {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const user = await this.userRepo.findById(performedBy);
        if (!user) {
          throw this.appError.notFound("User not found");
        }

        const purchaseOrder = await this.purchaseOrderRepo.findById(
          purchaseOrderId,
          session,
        );
        if (!purchaseOrder) {
          throw this.appError.notFound("Purchase order not found");
        }
        if (
          purchaseOrder.status !== "approved" &&
          purchaseOrder.status !== "partially_received"
        ) {
          throw this.appError.badRequest(
            "Only approved or partially received purchase orders can be received",
          );
        }

        const purchaseOrderItems =
          await this.purchaseOrderItemRepo.findByPurchaseOrderId(
            purchaseOrderId,
            session,
          );
        if (!purchaseOrderItems.length) {
          throw this.appError.badRequest(
            "Cannot receive a purchase order with no items",
          );
        }

        const byId = new Map(
          purchaseOrderItems.map((item) => [
            item._id.toString(),
            item,
          ]),
        );
        const byMedicine = new Map(
          purchaseOrderItems.map((item) => [
            item.medicineId._id.toString(),
            item,
          ]),
        );

        for (const line of data.items) {
          const poItem =
            (line.purchaseOrderItemId
              ? byId.get(line.purchaseOrderItemId)
              : undefined) ??
            (line.medicineId
              ? byMedicine.get(line.medicineId)
              : undefined);

          if (!poItem) {
            throw this.appError.badRequest(
              "Receipt line does not match a purchase order item",
            );
          }

          const alreadyReceived = poItem.receivedQuantity ?? 0;
          const remaining = poItem.quantity - alreadyReceived;
          if (line.quantityReceived > remaining) {
            throw this.appError.badRequest(
              `Received quantity exceeds the remaining ${remaining} units for this purchase order item`,
            );
          }
          if (line.sellingPrice < poItem.purchasePrice) {
            throw this.appError.badRequest(
              "Selling price cannot be less than purchase price",
            );
          }

          await this.batchService.createBatch(
            {
              medicineId: poItem.medicineId._id.toString(),
              purchaseOrderId,
              batchNumber: line.batchNumber,
              manufacturingDate: line.manufacturingDate,
              expiryDate: line.expiryDate,
              purchasePrice: poItem.purchasePrice,
              sellingPrice: line.sellingPrice,
              quantityReceived: line.quantityReceived,
              quantityRemaining: line.quantityReceived,
            },
            session,
            {
              referenceId: purchaseOrderId,
              referenceType: "PURCHASE_ORDER",
              movementType: "PURCHASE",
              performedBy,
              remarks: `Received from PO ${purchaseOrder.invoiceNumber}`,
            },
          );

          poItem.receivedQuantity = alreadyReceived + line.quantityReceived;
          await this.purchaseOrderItemRepo.update(
            poItem._id.toString(),
            { receivedQuantity: poItem.receivedQuantity },
            session,
          );
        }

        const fullyReceived = purchaseOrderItems.every(
          (item) => (item.receivedQuantity ?? 0) >= item.quantity,
        );

        await this.purchaseOrderRepo.update(
          purchaseOrderId,
          {
            status: fullyReceived ? "received" : "partially_received",
            ...(fullyReceived ? { receivedDate: new Date() } : {}),
            receivedBy: new Types.ObjectId(performedBy),
          },
          session,
        );
      });

      await this.invalidateDashboard();
      return { message: "Purchase order received successfully" };
    } finally {
      await session.endSession();
    }
  }
}
