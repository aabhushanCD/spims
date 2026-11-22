import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const createNotificationTemplateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  channel: z.enum(["Email", "SMS", "InApp"]),
  subject: z.string().trim().min(1).max(200),
  body: z.string().min(1).max(5000),
  isActive: z.boolean().optional(),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const notificationTemplateIdParamSchema = z.object({ id: objectIdSchema });

export const renderNotificationTemplateSchema = z.object({
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export type CreateNotificationTemplateDto = z.infer<
  typeof createNotificationTemplateSchema
>;
export type UpdateNotificationTemplateDto = z.infer<
  typeof updateNotificationTemplateSchema
>;
