import { z } from "zod";

export const returnConditionSchema = z.enum([
  "GOOD",
  "DAMAGED",
  "EXPIRED",
  "OPENED",
]);

export const createReturnItemSchema = z.object({
  saleItemId: z.string().min(1, "Sale item is required"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  condition: returnConditionSchema,
  restockingFee: z.coerce.number().min(0).optional(),
  remarks: z.string().max(500).optional(),
});

export const createReturnSchema = z.object({
  salesId: z.string().min(1),
  returnReason: z
    .string()
    .trim()
    .min(3, "Return reason is required")
    .max(500),
  returnedBy: z.string().min(1),
  returnDate: z.coerce.date(),
  items: z.array(createReturnItemSchema).min(1, "Select at least one item"),
});

export type CreateReturnForm = z.infer<typeof createReturnSchema>;
