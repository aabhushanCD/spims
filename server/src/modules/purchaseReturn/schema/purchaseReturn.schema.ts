import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import { cursorPaginationQuerySchema } from "../../../shared/schema/pagination.schema.ts";

export const purchaseReturnItemSchema = z.object({
  batchId: objectIdSchema,
  quantity: z.number().int().positive(),
  remarks: z.string().trim().max(500).optional(),
});

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: objectIdSchema,
  returnReason: z.string().trim().min(3).max(500),
  returnDate: z.coerce.date(),
  items: z.array(purchaseReturnItemSchema).min(1),
});

export const purchaseReturnStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
]);

export const purchaseReturnListQuerySchema = cursorPaginationQuerySchema.extend({
  status: purchaseReturnStatusSchema.optional(),
  supplierId: objectIdSchema.optional(),
  purchaseOrderId: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const purchaseReturnIdParamSchema = z.object({ id: objectIdSchema });
export const purchaseReturnSupplierParamSchema = z.object({
  supplierId: objectIdSchema,
});

export type CreatePurchaseReturnDto = z.infer<
  typeof createPurchaseReturnSchema
>;
export type PurchaseReturnListQuery = z.infer<
  typeof purchaseReturnListQuerySchema
>;
