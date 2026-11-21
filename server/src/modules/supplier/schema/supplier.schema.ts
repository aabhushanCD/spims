import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters")
  .max(100, "Company name must be at most 100 characters");

const contactPersonSchema = z
  .string()
  .trim()
  .min(2, "Contact person must be at least 2 characters")
  .max(100, "Contact person must be at most 100 characters");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must be at least 7 characters")
  .max(20, "Phone number must be at most 20 characters")
  .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number");

const addressSchema = z
  .string()
  .trim()
  .min(5, "Address must be at least 5 characters")
  .max(250, "Address must be at most 250 characters");

const leadTimeSchema = z
  .number()
  .int("Lead time must be a whole number")
  .positive("Lead time must be a positive integer");

const statusSchema = z.enum(["active", "inActive"]);

export const createSupplierSchema = z.object({
  companyName: companyNameSchema,
  contactPerson: contactPersonSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  leadTime: leadTimeSchema,
  status: statusSchema.default("active"),
});

export const updateSupplierSchema = z.object({
  companyName: companyNameSchema.optional(),
  contactPerson: contactPersonSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  leadTime: leadTimeSchema.optional(),
  status: statusSchema.optional(),
});

export const supplierIdParamSchema = z.object({ id: objectIdSchema });

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
