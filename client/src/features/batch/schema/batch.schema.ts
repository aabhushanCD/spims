import { z } from "zod";

const dateString = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `Enter a valid ${label.toLowerCase()}`,
    });

const baseFields = {
  batchNumber: z.string().trim().min(1, "Batch number is required").max(100),
  manufacturingDate: dateString("Manufacturing date"),
  expiryDate: dateString("Expiry date"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price cannot be negative"),
  sellingPrice: z.coerce.number().positive("Selling price is required"),
  remarks: z.string().max(500).optional(),
};

export const createBatchFormSchema = z
  .object({
    purchaseOrderId: z.string().min(1, "Purchase order is required"),
    medicineId: z.string().min(1, "Medicine is required"),
    quantityReceived: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity received must be at least 1"),
    quantityRemaining: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(0)
      .optional(),
    ...baseFields,
  })
  .refine(
    (value) => Date.parse(value.expiryDate) > Date.parse(value.manufacturingDate),
    {
      message: "Expiry date must be after the manufacturing date",
      path: ["expiryDate"],
    },
  );

export const updateBatchFormSchema = z
  .object({
    ...baseFields,
    quantityRemaining: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(0, "Quantity cannot be negative"),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) => Date.parse(value.expiryDate) > Date.parse(value.manufacturingDate),
    {
      message: "Expiry date must be after the manufacturing date",
      path: ["expiryDate"],
    },
  );

export type CreateBatchForm = z.infer<typeof createBatchFormSchema>;
export type UpdateBatchForm = z.infer<typeof updateBatchFormSchema>;
