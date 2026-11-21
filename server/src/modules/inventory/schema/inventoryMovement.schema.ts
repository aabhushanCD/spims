import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  stockMovementTypeSchema,
  stockReferenceTypeSchema,
} from "./stockMovement.schema.ts";

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

export type CreateInventoryMovementDto = z.infer<
  typeof createInventoryMovementSchema
>;
