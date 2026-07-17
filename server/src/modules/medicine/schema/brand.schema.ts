import { z } from "zod";

export const CreateBrandSchema = z.object({
  name: z.string().min(1, { message: "Brand name is required" }),
  description: z.string(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateBrandSchema = z.object({
  name: z.string().min(1, { message: "Brand name is required" }).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDto = z.infer<typeof UpdateBrandSchema>;
