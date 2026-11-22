import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),

  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value ||
        (value.length >= 7 &&
          value.length <= 20 &&
          /^\+?[0-9\s\-()]+$/.test(value)),
      { message: "Enter a valid phone number" },
    ),

  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value ||
        (value.length <= 200 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
      { message: "Enter a valid email address" },
    ),

  address: z.string().trim().max(250).optional(),

  isActive: z.boolean().optional(),
});

export type CustomerForm = z.infer<typeof customerSchema>;
