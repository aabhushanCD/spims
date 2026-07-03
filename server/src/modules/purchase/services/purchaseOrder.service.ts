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
} from "../schema/purchaseOrderItem.schama.ts";

export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly purchaseOrderItemRepo: PurchaseOrderItemRepo,
    private readonly medicineRepo: MedicineRepo,
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

      const purchaseOrder = await this.purchaseOrderRepo.create(
        {
          ...purchaseOrderData,
          supplierId: new Types.ObjectId(data.supplierId),
          orderDate: new Date(data.orderDate),
        },
        session,
      );

      for (const item of data.items) {
        await this.purchaseOrderItemRepo.create({
          purchaseOrderId: purchaseOrder._id.toString(),
          ...item,
        });
      }
      await this.recalculateTotals(purchaseOrder._id.toString());
    } finally {
      await session.commitTransaction();
      await session.endSession();
    }
  }

  async getPurchaseOrderById(id: string) {
    const purchaseOrder = await this.purchaseOrderRepo.findById(id);

    if (!purchaseOrder) {
      throw this.appError.notFound("Purchase order not found");
    }
    return purchaseOrder;
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

  async deletePurchaseOrder(id: string) {
    const existing = await this.purchaseOrderRepo.findById(id);

    if (!existing) {
      throw this.appError.notFound("Purchase order not found");
    }
    return this.purchaseOrderRepo.delete(id);
  }

  async receivedPurchaseOrder(id: string) {
    const existing = await this.purchaseOrderRepo.findById(id);

    if (!existing) {
      throw this.appError.notFound("Purchase order not found");
    }
    if (existing.status !== "approved") {
      throw this.appError.badRequest(
        "Only approved purchase orders can be received",
      );
    }
    await this.purchaseOrderRepo.update(id, { status: "received" });
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

  async receivePurchaseOrder(purchaseOrderId: string) {
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

    await this.purchaseOrderRepo.update(purchaseOrderId, {
      status: "received",
    });
  }
}
