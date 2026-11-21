import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const ReturnConditionSchema = z.enum([
  "GOOD",
  "DAMAGED",
  "EXPIRED",
  "OPENED",
]);

export const ReturnItemSchema = z.object({
  saleItemId: objectIdSchema,
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
  salesId: objectIdSchema,
  returnReason: z
    .string()
    .trim()
    .min(3, "Return reason is required")
    .max(500, "Return reason cannot exceed 500 characters"),
  returnedBy: objectIdSchema,
  returnDate: z.coerce.date(),
  items: z
    .array(ReturnItemSchema)
    .min(1, "At least one return item is required"),
});

export const UpdateReturnSchema = z.object({
  returnReason: z
    .string()
    .trim()
    .min(3, "Return reason is required")
    .max(500, "Return reason cannot exceed 500 characters"),
});

export const returnIdParamSchema = z.object({ id: objectIdSchema });

export type ReturnItemInput = z.infer<typeof ReturnItemSchema>;
export type CreateReturnDto = z.infer<typeof CreateReturnSchema>;
export type UpdateReturnDto = z.infer<typeof UpdateReturnSchema>;
