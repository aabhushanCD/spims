import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

const receiveItemSchema = z
  .object({
    purchaseOrderItemId: objectIdSchema.optional(),
    medicineId: objectIdSchema.optional(),
    batchNumber: z
      .string()
      .trim()
      .min(1, "Batch number is required")
      .max(100, "Batch number must be at most 100 characters"),
    manufacturingDate: z.coerce.date(),
    expiryDate: z.coerce.date(),
    sellingPrice: z.number().positive("Selling price must be greater than zero"),
    quantityReceived: z
      .number()
      .int("Quantity received must be a whole number")
      .positive("Quantity received must be greater than zero"),
    remarks: z
      .string()
      .trim()
      .max(500, "Remarks cannot exceed 500 characters")
      .optional()
      .default(""),
  })
  .refine(
    (value) => Boolean(value.purchaseOrderItemId || value.medicineId),
    { message: "purchaseOrderItemId or medicineId is required" },
  );

export const receivePurchaseOrderSchema = z
  .object({
    items: z
      .array(receiveItemSchema)
      .min(1, "At least one received item is required"),
  })
  .superRefine((value, ctx) => {
    const keys = value.items.map(
      (item) =>
        `${item.purchaseOrderItemId ?? item.medicineId}:${item.batchNumber}`,
    );
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate receipt line for the same item and batch number",
        path: ["items"],
      });
    }
  });

export type ReceivePurchaseOrderDto = z.infer<
  typeof receivePurchaseOrderSchema
>;
