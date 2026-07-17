import { z } from "zod";

export const ReturnConditionSchema = z.enum([
  "GOOD",
  "DAMAGED",
  "EXPIRED",
  "OPENED",
]);

export const ReturnItemSchema = z.object({
  saleItemId: z.string().min(1, "Sale Item ID is required"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),

  condition: ReturnConditionSchema,

  remarks: z
    .string()
    .trim()
    .max(500, "Remarks cannot exceed 500 characters")
    .optional(),
});

export const CreateReturnSchema = z.object({
  salesId: z.string().min(1, "Sales ID is required"),

  returnReason: z.string().trim().min(3, "Return reason is required").max(500),

  returnedBy: z.string().min(1, "Returned by is required"),

  returnDate: z.coerce.date(),

  items: z
    .array(ReturnItemSchema)
    .min(1, "At least one return item is required"),

  performedBy: z.string().min(1, "Performed by is required"),
});

export type ReturnItemInput = z.infer<typeof ReturnItemSchema>;
export type CreateReturnDto = z.infer<typeof CreateReturnSchema>;
