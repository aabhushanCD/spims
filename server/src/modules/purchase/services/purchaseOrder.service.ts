import mongoose, { Types } from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import type { IPurchaseOrder } from "../model/purchaseOrder.model.js";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import type { PurchaseOrderRepo } from "../repo/purchaseOrder.repo.ts";
import type { PurchaseOrderItemRepo } from "../repo/purchaseOrderItem.repo.ts";
import type { CreatePurchaseOrderDto } from "../schema/purchaseOrder.schema.ts";
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

export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly purchaseOrderItemRepo: PurchaseOrderItemRepo,
    private readonly batchService: BatchService,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

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

        const purchaseOrderPayload: Partial<IPurchaseOrder> = {
          ...purchaseOrderData,
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
              ...item,
            },
            session,
          );
        }
      });
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

      return deleted;
    } finally {
      await session.endSession();
    }
  }

  async cancelPurchaseOrder(id: string) {
    const existing = await this.purchaseOrderRepo.findById(id);

    if (!existing) {
      throw this.appError.notFound("Purchase order not found");
    }
    if (existing.status === "received") {
      throw this.appError.badRequest(
        "Received purchase orders cannot be cancelled",
      );
    }
    await this.purchaseOrderRepo.update(id, { status: "cancelled" });
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

  async approvePurchaseOrder(purchaseOrderId: string) {
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
    });
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
        if (purchaseOrder.status !== "approved") {
          throw this.appError.badRequest(
            "Only approved purchase orders can be received",
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

        const batchMap = new Map(
          data.items.map((item) => [item.medicineId, item]),
        );
        const ids = data.items.map((item) => item.medicineId);
        if (new Set(ids).size !== ids.length) {
          throw this.appError.badRequest(
            "Duplicate medicine found in batch data",
          );
        }
        if (data.items.length !== purchaseOrderItems.length) {
          throw this.appError.badRequest(
            "Batch data does not match purchase order",
          );
        }

        for (const poItem of purchaseOrderItems) {
          const batch = batchMap.get(poItem.medicineId._id.toString());
          if (!batch) {
            throw this.appError.badRequest(
              `No batch data provided for medicine with ID ${poItem.medicineId}`,
            );
          }
          if (batch.quantityReceived !== poItem.quantity) {
            throw this.appError.badRequest(
              `Quantity received for medicine with ID ${poItem.medicineId} does not match the ordered quantity`,
            );
          }
          if (batch.sellingPrice < poItem.purchasePrice) {
            throw this.appError.badRequest(
              "Selling price cannot be less than purchase price",
            );
          }

          await this.batchService.createBatch(
            {
              medicineId: poItem.medicineId._id.toString(),
              purchaseOrderId,
              batchNumber: batch.batchNumber,
              manufacturingDate: batch.manufacturingDate,
              expiryDate: batch.expiryDate,
              purchasePrice: poItem.purchasePrice,
              sellingPrice: batch.sellingPrice,
              quantityReceived: batch.quantityReceived,
              quantityRemaining: batch.quantityReceived,
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
        }

        await this.purchaseOrderRepo.update(
          purchaseOrderId,
          {
            status: "received",
            receivedDate: new Date(),
          },
          session,
        );
      });

      return { message: "Purchase order received successfully" };
    } finally {
      await session.endSession();
    }
  }
}
