import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string("Please enter your name")
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be at most 100 characters long")
    .trim(),
  email: z
    .string()
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export type RegisterInputDto = z.infer<typeof registerSchema>;
