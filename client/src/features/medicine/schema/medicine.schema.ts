import { z } from "zod";

export const medicineSchema = z.object({
  medicineName: z.string().min(2, "Medicine name is required"),

  genericNameId: z.string().optional(),

  categoryId: z.string().optional(),

  brandId: z.string().optional(),

  manufacturer: z.string().optional(),

  barcode: z.string().optional(),

  unitId: z.string().optional(),

  dosageForm: z.string().optional(),

  strength: z.string().min(1, "Strength is required"),

  reorderLevel: z.number().min(0).default(10).optional(),

  description: z.string().optional(),
});

// input type (before validation)
export type MedicineFormInput =
z.input<typeof medicineSchema>;


// output type (after validation)
export type MedicineFormData =
z.output<typeof medicineSchema>;
