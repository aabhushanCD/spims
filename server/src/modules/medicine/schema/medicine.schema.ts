import { z } from "zod";

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

  categoryId: z.string().min(1, "Category is required"),

  brandId: z.string().min(1, "Brand is required"),

  genericNameId: z.string().min(1, "Generic name is required"),

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

  unitId: z.string().min(1, "Unit is required"),

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

export type CreateMedicineDto = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineDto = z.infer<typeof updateMedicineSchema>;
