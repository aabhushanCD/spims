import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").trim(),

    email: z.email("Invalid email address").trim(),

    password: z.string().min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string(),

    role: z.enum(["admin", "pharmacist", "inventory_manager"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
