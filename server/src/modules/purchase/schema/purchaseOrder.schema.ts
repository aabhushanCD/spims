import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const createPurchaseOrderSchema = z.object({
  supplierId: objectIdSchema,
  orderDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().optional(),
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(100, "Invoice number must be at most 100 characters"),
  discount: z
    .number()
    .nonnegative("Discount must be greater than or equal to zero")
    .default(0),
  invoiceFile: z.string().trim().default(""),
  receivedDate: z.coerce.date().optional(),
  status: z
    .enum(["pending", "approved", "received", "cancelled"])
    .default("pending"),
  VAT: z
    .number()
    .nonnegative("VAT must be greater than or equal to zero")
    .default(13),
  items: z
    .array(
      z.object({
        medicineId: objectIdSchema,
        quantity: z
          .number()
          .positive("Quantity must be greater than zero"),
        purchasePrice: z
          .number()
          .positive("Purchase price must be greater than zero"),
      }),
    )
    .min(1, "At least one purchase order item is required"),
});

export const purchaseIdParamSchema = z.object({ id: objectIdSchema });
export const purchaseItemParamSchema = z.object({
  id: objectIdSchema,
  itemId: objectIdSchema,
});
export const purchaseSupplierParamSchema = z.object({
  supplierId: objectIdSchema,
});

export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
