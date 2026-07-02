import { z } from "zod";

export const CreateGenericNameSchema = z.object({
  name: z.string().min(1, { message: "Generic name is required" }),
  description: z.string(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateGenericNameSchema = z.object({
  name: z.string().min(1, { message: "Generic name is required" }).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateGenericNameDto = z.infer<typeof CreateGenericNameSchema>;
export type UpdateGenericNameDto = z.infer<typeof UpdateGenericNameSchema>;
