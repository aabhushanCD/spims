import { z } from "zod";

export const adjustBatchSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),

  remarks: z.string().max(500, "Remarks cannot exceed 500 characters").optional(),
});

export type AdjustBatchForm = z.infer<typeof adjustBatchSchema>;
