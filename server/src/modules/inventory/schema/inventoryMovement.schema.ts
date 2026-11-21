import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  stockMovementTypeSchema,
  stockReferenceTypeSchema,
} from "./stockMovement.schema.ts";
import {
  cursorPaginationQuerySchema,
  dateRangeQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

export const createInventoryMovementSchema = z.object({
  medicineId: objectIdSchema,
  batchId: objectIdSchema.optional(),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  movementType: stockMovementTypeSchema,
  referenceId: objectIdSchema,
  referenceType: stockReferenceTypeSchema.optional().default("SYSTEM"),
  performedBy: objectIdSchema,
  remarks: z.string().trim().max(500).optional().default(""),
});

export const inventoryMovementListQuerySchema = cursorPaginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    medicineId: objectIdSchema.optional(),
    batchId: objectIdSchema.optional(),
    referenceId: objectIdSchema.optional(),
    movementType: stockMovementTypeSchema.optional(),
    referenceType: stockReferenceTypeSchema.optional(),
  });

export type CreateInventoryMovementDto = z.infer<
  typeof createInventoryMovementSchema
>;
export type InventoryMovementListQuery = z.infer<
  typeof inventoryMovementListQuerySchema
>;
