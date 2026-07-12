import { z } from "zod";

export const masterDataSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  description: z.string().trim().max(255).optional(),
  isActive: z.boolean().default(true).optional(),
});

export type MasterDataForm = z.infer<typeof masterDataSchema>;
