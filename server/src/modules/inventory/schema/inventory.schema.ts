import { z } from "zod";

export const createInventorySchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  currentStock: z
    .number()
    .min(0, "Current stock must be a non-negative number"),
  reservedStock: z
    .number()
    .min(0, "Reserved stock must be a non-negative number"),
  availableStock: z
    .number()
    .min(0, "Available stock must be a non-negative number"),
  lastUpdated: z.string(),
});

export type CreateInventoryDto = z.infer<typeof createInventorySchema>;
