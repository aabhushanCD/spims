import { z } from "zod";

export const receivePurchaseSchema = z.object({
  items: z.array(
    z.object({
      medicineId: z.string(),

      quantityReceived: z.coerce.number().min(1),

      purchasePrice: z.coerce.number(),

      sellingPrice: z.coerce.number().min(1),

      batchNumber: z.string().min(1, "Batch number is required"),

      manufacturingDate: z.string().optional(),

      expiryDate: z.string().min(1, "Expiry date is required"),
    }),
  ),
});

export type ReceivePurchaseForm = z.infer<typeof receivePurchaseSchema>;
