import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  booleanQuerySchema,
  cursorPaginationQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9\s\-()]+$/, { message: "Invalid phone number" });

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: phoneSchema.optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  address: z.string().trim().max(250).optional(),
  isActive: z.boolean().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const customerListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  isActive: booleanQuerySchema.optional(),
});

export const customerIdParamSchema = z.object({ id: objectIdSchema });

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
