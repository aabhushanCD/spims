import { z } from "zod";

export const CreateUnitSchema = z.object({
  name: z.string().min(1, { message: "Unit name is required" }),
  description: z
    .string()
    .min(1, { message: "Unit description is required" })
    .max(10, {
      message: "Unit description must be at most 10 characters",
    }),
  isActive: z.boolean().optional().default(true),
});

export const UpdateUnitSchema = z.object({
  name: z.string().min(1, { message: "Unit name is required" }).optional(),
  description: z
    .string()
    .min(1, { message: "Unit description is required" })
    .max(10, {
      message: "Unit description must be at most 10 characters",
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateUnitDto = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitDto = z.infer<typeof UpdateUnitSchema>;
