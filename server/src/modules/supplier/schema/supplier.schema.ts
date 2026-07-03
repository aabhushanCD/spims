import { z } from "zod";

export const createSupplierSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  contactPerson: z.string().min(1, { message: "Contact person is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  leadTime: z
    .number()
    .int()
    .positive({ message: "Lead time must be a positive integer" }),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateSupplierSchema = z.object({
  companyName: z
    .string()
    .min(1, { message: "Company name is required" })
    .optional(),
  contactPerson: z
    .string()
    .min(1, { message: "Contact person is required" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().min(1, { message: "Phone number is required" }).optional(),
  address: z.string().min(1, { message: "Address is required" }).optional(),
  leadTime: z
    .number()
    .int()
    .positive({ message: "Lead time must be a positive integer" })
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
