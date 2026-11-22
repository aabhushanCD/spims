import { z } from "zod";

const dateString = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `Enter a valid ${label.toLowerCase()}`,
    });

export const receivePurchaseSchema = z.object({
  items: z
    .array(
      z.object({
        purchaseOrderItemId: z
          .string()
          .min(1, "Purchase order item is required"),

        medicineId: z.string().min(1, "Medicine is required"),

        quantityReceived: z.coerce
          .number()
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1"),

        sellingPrice: z.coerce.number().positive("Selling price is required"),

        batchNumber: z.string().min(1, "Batch number is required"),

        manufacturingDate: dateString("Manufacturing date"),

        expiryDate: dateString("Expiry date"),

        remarks: z.string().max(500).optional(),
      }),
    )
    .min(1, "At least one item must be received"),
});

export type ReceivePurchaseForm = z.infer<typeof receivePurchaseSchema>;
