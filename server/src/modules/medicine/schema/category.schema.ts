import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string("Category name must be a string")
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters"),

  description: z
    .string("Category description must be a string")
    .trim()
    .max(500, "Category description must be at most 500 characters")
    .optional(),

  isActive: z.boolean("Category isActive must be a boolean").optional(),

  createdBy: z
    .string("Category createdBy must be a string")
    .trim()
    .min(1, "Category createdBy is required"),

  updatedBy: z.string("Category updatedBy must be a string").trim().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string("Category name must be a string")
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters")
    .optional(),

  description: z
    .string("Category description must be a string")
    .trim()
    .max(500, "Category description must be at most 500 characters")
    .optional(),

  isActive: z.boolean("Category isActive must be a boolean").optional(),

  updatedBy: z.string("Category updatedBy must be a string").trim().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
