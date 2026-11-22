import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";
import { cursorPaginationQuerySchema } from "../../../shared/schema/pagination.schema.ts";

export const auditQuerySchema = cursorPaginationQuerySchema.extend({
  action: z.string().trim().min(1).max(100).optional(),
  actorId: objectIdSchema.optional(),
  entityType: z.string().trim().min(1).max(100).optional(),
  entityId: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["SUCCESS", "FAILURE"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
