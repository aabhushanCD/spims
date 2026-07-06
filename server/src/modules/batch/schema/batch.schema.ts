import { z } from "zod";

export const createBatchSchema = z.object({
  medicineId: z.string().nonempty("Medicine ID is required"),
  purchaseOrderId: z.string().nonempty("Purchase Order ID is required"),
  batchNumber: z.string().nonempty("Batch number is required"),
  expiryDate: z.string().nonempty("Expiry date is required"),
  manufacturingDate: z.string().nonempty("Manufacturing date is required"),
  purchasePrice: z
    .number()
    .positive("Purchase price must be a positive number"),
  sellingPrice: z.number().positive("Selling price must be a positive number"),
  quantityReceived: z
    .number()
    .int()
    .positive("Quantity received must be a positive integer"),
});

export const updateBatchSchema = z.object({
  expiryDate: z.string().nonempty("Expiry date is required").optional(),
  manufacturingDate: z
    .string()
    .nonempty("Manufacturing date is required")
    .optional(),

  sellingPrice: z
    .number()
    .positive("Selling price must be a positive number")
    .optional(),
});

export type CreateBatchDto = z.infer<typeof createBatchSchema>;
export type UpdateBatchDto = z.infer<typeof updateBatchSchema>;
