import { z } from "zod";

export const createPurchaseOrderItemSchema = z.object({
  purchaseOrderId: z.string().nonempty("Purchase order ID is required"),
  medicineId: z.string().nonempty("Medicine ID is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  purchasePrice: z
    .number()
    .positive("Purchase price must be greater than zero"),
});

export const updatePurchaseOrderItemSchema = z.object({
  quantity: z
    .number()
    .positive("Quantity must be greater than zero")
    .optional(),
  purchasePrice: z
    .number()
    .positive("Purchase price must be greater than zero")
    .optional(),
});

export type CreatePurchaseOrderItemDto = z.infer<
  typeof createPurchaseOrderItemSchema
>;
export type UpdatePurchaseOrderItemDto = z.infer<
  typeof updatePurchaseOrderItemSchema
>;
