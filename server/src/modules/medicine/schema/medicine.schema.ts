import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  booleanQuerySchema,
  cursorPaginationQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

export const medicineSearchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Search query is required")
    .max(100, "Search query must be at most 100 characters"),
});

export const createMedicineSchema = z.object({
  medicineName: z
    .string()
    .trim()
    .min(1, "Medicine name is required")
    .max(100, "Medicine name must be at most 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),

  categoryId: objectIdSchema,

  brandId: objectIdSchema,

  genericNameId: objectIdSchema,

  manufacturer: z
    .string()
    .trim()
    .max(100, "Manufacturer must be at most 100 characters")
    .optional(),

  barcode: z
    .string()
    .trim()
    .max(50, "Barcode must be at most 50 characters")
    .optional(),

  unitId: objectIdSchema,

  dosageForm: z
    .string()
    .trim()
    .max(100, "Dosage form must be at most 100 characters")
    .optional(),

  strength: z
    .string()
    .trim()
    .max(100, "Strength must be at most 100 characters"),

  reorderLevel: z
    .number()
    .int("Reorder level must be an integer")
    .min(0, "Reorder level cannot be negative")
    .default(0),

  isActive: z.boolean().default(true),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const medicineListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  isActive: booleanQuerySchema.optional(),
  categoryId: objectIdSchema.optional(),
  brandId: objectIdSchema.optional(),
  genericNameId: objectIdSchema.optional(),
  unitId: objectIdSchema.optional(),
});

export type CreateMedicineDto = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineDto = z.infer<typeof updateMedicineSchema>;
export type MedicineListQuery = z.infer<typeof medicineListQuerySchema>;
