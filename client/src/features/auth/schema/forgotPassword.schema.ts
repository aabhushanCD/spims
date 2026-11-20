import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address").trim(),
});

export type ForgotPasswordFormData = z.infer<
  typeof forgotPasswordSchema
>;

export const resendVerificationSchema = forgotPasswordSchema;
export type ResendVerificationFormData = ForgotPasswordFormData;
