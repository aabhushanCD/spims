import { z } from "zod";

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid or missing reset token")
    .max(256, "Invalid reset token"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export type ResetPasswordInputDto = z.infer<typeof resetPasswordSchema>;
