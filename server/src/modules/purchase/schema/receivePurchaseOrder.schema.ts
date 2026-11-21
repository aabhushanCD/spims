import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

const receiveItemSchema = z.object({
  medicineId: objectIdSchema,
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
});

export const receivePurchaseOrderSchema = z
  .object({
    items: z
      .array(receiveItemSchema)
      .min(1, "At least one received item is required"),
  })
  .superRefine((value, ctx) => {
    const ids = value.items.map((item) => item.medicineId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate medicine found in batch data",
        path: ["items"],
      });
    }
  });

export type ReceivePurchaseOrderDto = z.infer<
  typeof receivePurchaseOrderSchema
>;
