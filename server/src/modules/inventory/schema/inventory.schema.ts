import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  stockMovementTypeSchema,
  stockReferenceTypeSchema,
} from "./stockMovement.schema.ts";

const remarksSchema = z
  .string()
  .trim()
  .max(500, "Remarks cannot exceed 500 characters")
  .optional();

const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .positive("Quantity must be greater than zero");

const movementMetadataSchema = {
  batchId: objectIdSchema.optional(),
  referenceId: objectIdSchema.optional(),
  referenceType: stockReferenceTypeSchema.optional(),
  remarks: remarksSchema,
};

export const createInventorySchema = z
  .object({
    medicineId: objectIdSchema,
    reservedStock: z
      .number()
      .int("Reserved stock must be a whole number")
      .nonnegative("Reserved stock must be greater than or equal to zero")
      .optional(),
    movementType: stockMovementTypeSchema.optional(),
    ...movementMetadataSchema,
  })
  .strict();

export const increaseStockSchema = z.object({
  quantity: quantitySchema,
  batchId: objectIdSchema,
  referenceId: objectIdSchema,
  referenceType: stockReferenceTypeSchema,
  movementType: z.enum(["PURCHASE", "RETURN"]),
  remarks: remarksSchema,
});

export const decreaseStockSchema = z.object({
  quantity: quantitySchema,
  batchId: objectIdSchema,
  referenceId: objectIdSchema,
  referenceType: stockReferenceTypeSchema,
  movementType: z.enum(["SALE", "EXPIRED", "ADJUSTMENT"]),
  remarks: remarksSchema,
});

export const reserveStockSchema = z.object({
  quantity: quantitySchema,
  batchId: objectIdSchema.optional(),
  referenceId: objectIdSchema,
  referenceType: stockReferenceTypeSchema,
  remarks: remarksSchema,
});

export const releaseStockSchema = reserveStockSchema;

export const syncInventorySchema = z
  .object({ remarks: remarksSchema })
  .optional();

export const updateInventorySchema = z
  .object({
    reservedStock: z
      .number()
      .int("Reserved stock must be a whole number")
      .nonnegative("Reserved stock must be greater than or equal to zero")
      .optional(),
    lastUpdated: z.coerce.date().optional(),
    movementType: stockMovementTypeSchema.optional(),
    ...movementMetadataSchema,
  })
  .strict();

export const deleteInventorySchema = z
  .object({
    batchId: objectIdSchema.optional(),
    referenceId: objectIdSchema.optional(),
    referenceType: stockReferenceTypeSchema.optional(),
    remarks: remarksSchema,
  })
  .optional();

export const inventorySearchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Search query is required")
    .max(100, "Search query must be at most 100 characters"),
});

export const inventoryIdParamSchema = z.object({ id: objectIdSchema });
export const inventoryMedicineParamSchema = z.object({
  medicineId: objectIdSchema,
});

export type CreateInventoryDto = z.infer<typeof createInventorySchema>;
