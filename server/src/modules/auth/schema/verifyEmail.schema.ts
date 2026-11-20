import { z } from "zod";

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid or missing verification token")
    .max(256, "Invalid verification token"),
});

export type VerifyEmailInputDto = z.infer<typeof verifyEmailSchema>;
