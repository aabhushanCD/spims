import { Types } from "mongoose";

import { logger } from "../../../shared/logger.ts";
import type {
  AuditEvent,
  AuditRecorder,
} from "../../../shared/security/security.types.ts";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";
import type { AuditLogRepo } from "../repo/auditLog.repo.ts";
import type { AuditQuery } from "../schema/audit.schema.ts";

const REDACTED = "[REDACTED]";
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 20;
const MAX_DEPTH = 3;
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|api[-_]?key/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) {
      return "[Truncated]";
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEY.test(key) ? REDACTED : sanitize(entry, depth + 1),
      ]),
    );
  }

  return String(value);
}

export class AuditService implements AuditRecorder {
  constructor(private readonly auditLogRepo: AuditLogRepo) {}

  /**
   * Audit persistence is deliberately best-effort. A failed audit insert must
   * never turn a successful login or admin action into a 500, but it is logged
   * so the gap is visible.
   */
  async record(event: AuditEvent): Promise<void> {
    try {
      await this.auditLogRepo.create({
        actorId:
          event.actorId && Types.ObjectId.isValid(event.actorId)
            ? new Types.ObjectId(event.actorId)
            : null,
        actorRole: event.actorRole ?? null,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        status: event.status ?? "SUCCESS",
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        requestId: event.requestId ?? null,
        metadata: sanitize(event.metadata ?? {}) as Record<string, unknown>,
      });
    } catch (error) {
      logger.error("audit_record_failed", {
        action: event.action,
        entityType: event.entityType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getPage(query: AuditQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.auditLogRepo.findPage(
      {
        ...(query.action ? { action: query.action } : {}),
        ...(query.actorId ? { actorId: query.actorId } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      },
      cursor,
      query.limit + 1,
    );

    const items = rows.map((row) => {
      const rawActor = row.actorId as unknown;

      if (
        rawActor &&
        typeof rawActor === "object" &&
        "name" in rawActor
      ) {
        const actor = rawActor as {
          _id: unknown;
          name?: string;
          email?: string;
          role?: string;
        };

        return {
          ...row,
          actorId: String(actor._id),
          actor: {
            _id: String(actor._id),
            name: actor.name ?? "",
            email: actor.email ?? "",
            role: actor.role ?? null,
          },
        };
      }

      return {
        ...row,
        actorId: rawActor ? String(rawActor) : null,
        actor: null,
      };
    });

    return buildPage(
      items,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }
}

export { sanitize as sanitizeAuditMetadata };
