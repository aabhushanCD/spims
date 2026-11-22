import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  stockMovementTypeSchema,
  stockReferenceTypeSchema,
} from "../../inventory/schema/stockMovement.schema.ts";
import {
  booleanQuerySchema,
  cursorPaginationQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

const batchNumberSchema = z
  .string()
  .trim()
  .min(1, "Batch number is required")
  .max(100, "Batch number must be at most 100 characters");

const positivePriceSchema = z
  .number()
  .positive("Price must be a positive number");

const nonNegativePriceSchema = z
  .number()
  .nonnegative("Price must be greater than or equal to zero");

const remarksSchema = z
  .string()
  .trim()
  .max(500, "Remarks cannot exceed 500 characters")
  .optional();

const movementMetadataSchema = z.object({
  referenceId: objectIdSchema.optional(),
  referenceType: stockReferenceTypeSchema.optional(),
  remarks: remarksSchema,
});

export const createBatchSchema = z.object({
  medicineId: objectIdSchema,
  purchaseOrderId: objectIdSchema,
  batchNumber: batchNumberSchema,
  expiryDate: z.coerce.date(),
  manufacturingDate: z.coerce.date(),
  purchasePrice: nonNegativePriceSchema,
  sellingPrice: positivePriceSchema,
  quantityReceived: z
    .number()
    .int("Quantity received must be a whole number")
    .positive("Quantity received must be greater than zero"),
  quantityRemaining: z
    .number()
    .int("Quantity remaining must be a whole number")
    .nonnegative("Quantity remaining must be greater than or equal to zero")
    .optional(),
  ...movementMetadataSchema.shape,
});

export const updateBatchSchema = z.object({
  batchNumber: batchNumberSchema.optional(),
  expiryDate: z.coerce.date().optional(),
  manufacturingDate: z.coerce.date().optional(),
  purchasePrice: nonNegativePriceSchema.optional(),
  sellingPrice: positivePriceSchema.optional(),
  quantityRemaining: z
    .number()
    .int("Quantity remaining must be a whole number")
    .nonnegative("Quantity remaining must be greater than or equal to zero")
    .optional(),
  isActive: z.boolean().optional(),
  movementType: stockMovementTypeSchema.optional(),
  ...movementMetadataSchema.shape,
});

export const batchQuantitySchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be a positive number"),
  remarks: remarksSchema,
});

export const batchAdjustSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .nonnegative("Quantity must be greater than or equal to zero"),
  remarks: remarksSchema,
});

export const confirmDisposalSchema = z
  .object({ remarks: remarksSchema })
  .optional();

export const batchListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  medicineId: objectIdSchema.optional(),
  purchaseOrderId: objectIdSchema.optional(),
  isExpired: booleanQuerySchema.optional(),
  isActive: booleanQuerySchema.optional(),
  expiringInDays: z.coerce.number().int().min(0).optional(),
});

export const batchIdParamSchema = z.object({ id: objectIdSchema });
export const batchMedicineParamSchema = z.object({ medicineId: objectIdSchema });
export const lowStockQuerySchema = z.object({
  threshold: z.coerce
    .number()
    .nonnegative("Threshold must be greater than or equal to zero")
    .default(10),
});

export type CreateBatchDto = z.infer<typeof createBatchSchema>;
export type UpdateBatchDto = z.infer<typeof updateBatchSchema>;
export type BatchListQuery = z.infer<typeof batchListQuerySchema>;
