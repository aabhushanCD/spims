import mongoose, { Types } from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import type { PurchaseOrderRepo } from "../repo/purchaseOrder.repo.ts";
import type { PurchaseOrderItemRepo } from "../repo/purchaseOrderItem.repo.ts";
import type { CreatePurchaseOrderDto } from "../schema/purchaseOrder.schema.ts";
import type {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from "../schema/purchaseOrderItem.schema.ts";

import type { BatchService } from "../../batch/service/batch.service.ts";
import type { ReceivePurchaseOrderDto } from "../schema/receivePurchaseOrder.type.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { InventoryMovementService } from "../../inventory/services/inventoryMovement.service.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";

export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly purchaseOrderItemRepo: PurchaseOrderItemRepo,
    private readonly inventoryService: InventoryService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly batchService: BatchService,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
  ) {}

  async createPurchaseOrder(data: CreatePurchaseOrderDto) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const supplier = await this.supplierRepo.findById(data.supplierId);

      if (!supplier) {
        throw this.appError.notFound("Supplier not found");
      }

      const { items, ...purchaseOrderData } = data;

      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.purchasePrice,
        0,
      );

      const purchaseOrderPayload = {
        ...purchaseOrderData,
        supplierId: new Types.ObjectId(data.supplierId),
        totalAmount,
        ...(purchaseOrderData.orderDate !== undefined
          ? { orderDate: purchaseOrderData.orderDate }
          : {}),
      };

      const purchaseOrder = await this.purchaseOrderRepo.create(
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
      await session.commitTransaction();
      return purchaseOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
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
    const existing = await this.purchaseOrderRepo.findById(id);

    if (!existing) {
      throw this.appError.notFound("Purchase order not found");
    }
    return this.purchaseOrderRepo.delete(id);
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
    data: CreatePurchaseOrderItemDto,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }

    const existing =
      await this.purchaseOrderItemRepo.findByPurchaseOrderAndMedicine(
        purchaseOrderId,
        data.medicineId,
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

    await this.purchaseOrderItemRepo.create({
      ...data,
      purchaseOrderId: purchaseOrder._id.toString(),
    });
    await this.recalculateTotals(purchaseOrderId);
  }

  async updatePurchaseOrderItem(
    purchaseOrderId: string,
    itemId: string,
    data: UpdatePurchaseOrderItemDto,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }

    if (purchaseOrder.status !== "pending") {
      throw this.appError.badRequest(
        "Items can only be updated in pending purchase orders",
      );
    }
    const existingItem = await this.purchaseOrderItemRepo.findById(itemId);

    if (!existingItem) {
      throw this.appError.notFound("Purchase order item not found");
    }

    if (existingItem.purchaseOrderId.toString() !== purchaseOrderId) {
      throw this.appError.badRequest(
        "Purchase order item does not belong to the specified purchase order",
      );
    }

    return this.purchaseOrderItemRepo.update(itemId, data);
  }

  async removePurchaseOrderItem(purchaseOrderId: string, itemId: string) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    if (purchaseOrder.status !== "pending") {
      throw this.appError.badRequest(
        "Only pending purchase orders can be modified",
      );
    }

    const existingItem = await this.purchaseOrderItemRepo.findById(itemId);

    if (!existingItem) {
      throw this.appError.notFound("Purchase order item not found");
    }

    if (existingItem.purchaseOrderId.toString() !== purchaseOrderId) {
      throw this.appError.badRequest(
        "Purchase order item does not belong to the specified purchase order",
      );
    }
    await this.purchaseOrderItemRepo.delete(itemId);
    await this.recalculateTotals(purchaseOrderId);
  }

  async recalculateTotals(purchaseOrderId: string) {
    const purchaseOrder =
      await this.purchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    const items =
      await this.purchaseOrderItemRepo.findByPurchaseOrderId(purchaseOrderId);

    return items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0,
    );
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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await this.userRepo.findById(performedBy);

      if (!user) {
        throw this.appError.notFound("User not found");
      }
      const purchaseOrder =
        await this.purchaseOrderRepo.findById(purchaseOrderId);

      if (!purchaseOrder) {
        throw this.appError.notFound("Purchase order not found");
      }

      if (purchaseOrder.status !== "approved") {
        throw this.appError.badRequest(
          "Only approved purchase orders can be received",
        );
      }

      const purchaseOrderItems =
        await this.purchaseOrderItemRepo.findByPurchaseOrderId(purchaseOrderId);

        
      if (!purchaseOrderItems.length) {
        throw this.appError.badRequest(
          "Cannot receive a purchase order with no items",
        );
      }
      const batchMap = new Map(
        data.items.map((item) => [item.medicineId, item]),
      );

      const ids = data.items.map((i) => i.medicineId);

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

        const batchRecord = await this.batchService.createBatch(
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
        );
        
        await this.inventoryService.syncInventoryFromBatch(
          poItem.medicineId._id.toString(),
          {
            batchId: batchRecord.id,
            movementType: "PURCHASE",
            referenceId: purchaseOrderId,
            referenceType: "PURCHASE_ORDER",
            performedBy,
            remarks: `Received from PO ${purchaseOrder.invoiceNumber}`,
          },
          session,
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
      await session.commitTransaction();
      return {
        message: "Purchase order received successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
