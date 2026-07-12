import { z } from "zod";

export const supplierSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),

  contactPerson: z.string().optional(),

  phone: z.string().min(10, "Phone number is required"),

  email: z.string().email().optional().or(z.literal("")),

  leadTime: z
    .number()
    .min(0, "Lead time cannot be negative")
    .max(365, "Lead time seems too high")
    .default(3).optional(),
    
  address: z.string().optional(),

  panNumber: z.string().optional(),

  isActive: z.boolean(),
});

export type SupplierForm = z.infer<typeof supplierSchema>;
