import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import { cursorPaginationQuerySchema } from "../../../shared/schema/pagination.schema.ts";

export const stocktakeItemSchema = z.object({
  batchId: objectIdSchema,
  countedQuantity: z.number().int().min(0),
  remarks: z.string().trim().max(500).optional(),
});

export const createStocktakeSchema = z.object({
  items: z.array(stocktakeItemSchema).min(1),
  notes: z.string().trim().max(500).optional(),
});

export const updateStocktakeSchema = z.object({
  items: z.array(stocktakeItemSchema).min(1).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const stocktakeListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z
    .enum(["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
});

export const stocktakeIdParamSchema = z.object({ id: objectIdSchema });

export type CreateStocktakeDto = z.infer<typeof createStocktakeSchema>;
export type UpdateStocktakeDto = z.infer<typeof updateStocktakeSchema>;
export type StocktakeListQuery = z.infer<typeof stocktakeListQuerySchema>;
