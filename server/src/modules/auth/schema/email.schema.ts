import { z } from "zod";

export const emailSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
});

export type EmailInputDto = z.infer<typeof emailSchema>;
