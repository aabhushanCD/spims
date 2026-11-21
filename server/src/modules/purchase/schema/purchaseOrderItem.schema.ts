import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const createPurchaseOrderItemSchema = z.object({
  medicineId: objectIdSchema,
  quantity: z.number().positive("Quantity must be greater than zero"),
  purchasePrice: z
    .number()
    .positive("Purchase price must be greater than zero"),
});

export const updatePurchaseOrderItemSchema = z
  .object({
    quantity: z
      .number()
      .positive("Quantity must be greater than zero")
      .optional(),
    purchasePrice: z
      .number()
      .positive("Purchase price must be greater than zero")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreatePurchaseOrderItemInput = z.infer<
  typeof createPurchaseOrderItemSchema
>;

/** Repository input: the route supplies the id, not the client. */
export type CreatePurchaseOrderItemDto = CreatePurchaseOrderItemInput & {
  purchaseOrderId: string;
};

export type UpdatePurchaseOrderItemDto = z.infer<
  typeof updatePurchaseOrderItemSchema
>;
