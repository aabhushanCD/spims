import type { AuditStatus } from "../../../shared/security/security.types.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";
import type AuditLog from "../model/auditLog.model.ts";
import type { IAuditLog } from "../model/auditLog.model.ts";

export interface AuditLogFilters {
  action?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  status?: AuditStatus;
  from?: Date;
  to?: Date;
}

export class AuditLogRepo {
  constructor(private readonly auditLogModel: typeof AuditLog) {}

  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return await new this.auditLogModel(data).save();
  }

  async findPage(
    filters: AuditLogFilters,
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IAuditLog[]> {
    const conditions: Record<string, unknown>[] = [];

    if (filters.action) {
      conditions.push({ action: filters.action });
    }
    if (filters.actorId) {
      conditions.push({ actorId: filters.actorId });
    }
    if (filters.entityType) {
      conditions.push({ entityType: filters.entityType });
    }
    if (filters.entityId) {
      conditions.push({ entityId: filters.entityId });
    }
    if (filters.status) {
      conditions.push({ status: filters.status });
    }
    if (filters.from || filters.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) {
        createdAt.$gte = filters.from;
      }
      if (filters.to) {
        createdAt.$lte = filters.to;
      }
      conditions.push({ createdAt });
    }

    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    return await this.auditLogModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate("actorId", "name email role")
      .lean()
      .exec();
  }
}
