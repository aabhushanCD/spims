import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  cursorPaginationQuerySchema,
  dateRangeQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "QR",
  "Mobile Banking",
  "CREDIT",
]);

/**
 * Sales Item Schema
 */
export const createSalesItemSchema = z.object({
  // Optional: FEFO chooses the batch. Accepted for older clients.
  batchId: objectIdSchema.optional(),
  medicineId: objectIdSchema,
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero"),
  discountPercentage: z
    .number()
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100")
    .default(0),
});

/**
 * Create Sale Schema
 */
export const createSaleSchema = z.object({
  customerId: objectIdSchema.optional(),
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name must not be empty")
    .max(100, "Customer name must be at most 100 characters")
    .optional(),
  paymentMethod: paymentMethodSchema,
  saleDate: z.coerce.date(),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
  items: z
    .array(createSalesItemSchema)
    .min(1, "At least one sale item is required"),
});

/**
 * Update Sale Schema
 *
 * Only non-financial fields are editable here. Totals and line items change
 * through dedicated flows so stock and VAT cannot drift.
 */
export const updateSaleSchema = z
  .object({
    customerId: objectIdSchema.nullable().optional(),
    customerName: z
      .string()
      .trim()
      .min(1, "Customer name must not be empty")
      .max(100, "Customer name must be at most 100 characters")
      .optional(),
    paymentMethod: paymentMethodSchema.optional(),
  })
  .refine(
    (value) =>
      value.customerId !== undefined ||
      value.customerName !== undefined ||
      value.paymentMethod !== undefined,
    { message: "At least one field must be provided" },
  );

export const updateSaleItemSchema = z
  .object({
    unitPrice: z.number().positive("Unit price must be greater than zero").optional(),
    discount: z.number().min(0, "Discount cannot be negative").optional(),
  })
  .refine((value) => value.unitPrice !== undefined || value.discount !== undefined, {
    message: "At least one field must be provided",
  });

export const salesListQuerySchema = cursorPaginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    search: z.string().trim().min(1).max(100).optional(),
    status: z
      .enum([
        "COMPLETED",
        "PARTIALLY_RETURNED",
        "RETURNED",
        "CANCELLED",
        "PENDING",
      ])
      .optional(),
    cashierId: objectIdSchema.optional(),
    customerId: objectIdSchema.optional(),
  });

export const saleIdParamSchema = z.object({ id: objectIdSchema });
export const saleItemIdParamSchema = z.object({ id: objectIdSchema });
export const saleItemSalesParamSchema = z.object({ salesId: objectIdSchema });

export type CreateSaleDto = z.infer<typeof createSaleSchema> & {
  cashierId: string;
};
export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;
export type UpdateSaleItemDto = z.infer<typeof updateSaleItemSchema>;
export type SalesListQuery = z.infer<typeof salesListQuerySchema>;
