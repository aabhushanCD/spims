import { z } from "zod";

export const createInventoryMovementSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  movementType: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "EXPIRED",
    "RESERVE",
    "RELEASE",
  ]),
  referenceId: z.string().min(1, "Reference ID is required"),
  referenceType: z.string().optional().default("SYSTEM"),
  performedBy: z.string().min(1, "Performed by is required"),
  remarks: z.string().optional().default(""),
});

export type CreateInventoryMovementDto = z.infer<
  typeof createInventoryMovementSchema
>;
