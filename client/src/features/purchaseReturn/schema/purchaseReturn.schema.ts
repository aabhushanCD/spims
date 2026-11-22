import { z } from "zod";

export const purchaseReturnItemSchema = z.object({
  batchId: z.string().min(1),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  remarks: z.string().max(500).optional(),
});

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  returnReason: z
    .string()
    .trim()
    .min(3, "Return reason is required")
    .max(500),
  returnDate: z.coerce.date(),
  items: z.array(purchaseReturnItemSchema).min(1, "Select at least one batch"),
});

export type CreatePurchaseReturnForm = z.infer<
  typeof createPurchaseReturnSchema
>;
