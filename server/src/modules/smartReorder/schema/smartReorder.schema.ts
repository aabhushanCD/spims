import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const smartReorderListQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "ALL"])
    .optional(),
});

export const smartReorderIdParamSchema = z.object({ id: objectIdSchema });
export const smartReorderMedicineParamSchema = z.object({
  medicineId: objectIdSchema,
});

export const createSmartReorderSchema = z.object({
  medicineId: objectIdSchema,
  supplierId: objectIdSchema,
  suggestedQuantity: z.number().positive(),
  confidenceScore: z.number().min(0).max(100),
  recommendationReason: z.string().trim().min(1).max(1000),
});

export const rejectSmartReorderSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});
