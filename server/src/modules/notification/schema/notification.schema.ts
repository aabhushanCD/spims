import { z } from "zod";
import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "../notification.constants.ts";
import { objectIdSchema as objectId } from "../../../shared/schema/objectId.schema.ts";

export const createNotificationSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    message: z.string().trim().min(1).max(5000).optional(),
    templateKey: z.string().trim().min(1).max(100).optional(),
    templateData: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
    type: z.enum(["Email", "SMS", "InApp"]),
    userIds: z
      .array(objectId)
      .min(1, { message: "At least one recipient is required" }),
  })
  .refine(
    (value) =>
      Boolean(value.templateKey) ||
      (Boolean(value.title) && Boolean(value.message)),
    { message: "Provide title+message or templateKey" },
  );

export const notificationIdParamSchema = z.object({ id: objectId });

export const userIdParamSchema = z.object({ userId: objectId });

export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
});

const booleanString = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

export const forceRetryQuerySchema = z.object({
  force: booleanString.optional(),
});

export const preferencesSchema = z
  .object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  })
  .refine((value) => value.email !== undefined || value.sms !== undefined, {
    message: "At least one preference is required",
  });

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
