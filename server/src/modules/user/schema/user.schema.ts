import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import {
  booleanQuerySchema,
  cursorPaginationQuerySchema,
} from "../../../shared/schema/pagination.schema.ts";

export const userRoleSchema = z.enum([
  "inventory_manager",
  "owner",
  "pharmacist",
]);

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

const isActiveParamSchema = z.enum(["true", "false"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" })
    .optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .optional(),
  role: userRoleSchema.optional(),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Phone number must be at least 7 characters" })
    .max(20, { message: "Phone number must be at most 20 characters" })
    .regex(/^\+?[0-9\s\-()]+$/, { message: "Invalid phone number" })
    .optional(),
  isActive: z.boolean().optional(),
});

export const changeUserRoleSchema = z.object({ role: userRoleSchema });

/**
 * DELETE must not accept a role in the body. Authorization comes from the
 * authenticated JWT, not from client-supplied data.
 */
export const deleteUserBodySchema = z.object({}).strict().optional();

export const userListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: userRoleSchema.optional(),
  isActive: booleanQuerySchema.optional(),
});

export const userIdParamSchema = z.object({ id: objectIdSchema });
export const userRoleParamSchema = z.object({ role: userRoleSchema });
export const userRoleStatusParamSchema = z.object({
  role: userRoleSchema,
  isActive: isActiveParamSchema,
});
export const userRoleDateParamSchema = z.object({
  role: userRoleSchema,
  date: dateStringSchema,
});
export const userStatusDateParamSchema = z.object({
  isActive: isActiveParamSchema,
  date: dateStringSchema,
});
export const userDateParamSchema = z.object({ date: dateStringSchema });

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangeUserRoleDto = z.infer<typeof changeUserRoleSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
