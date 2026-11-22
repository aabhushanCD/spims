import { Schema, Types, model, type Document } from "mongoose";
import type { AuditStatus } from "../../../shared/security/security.types.ts";

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  status: AuditStatus;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorRole: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    ip: {
      type: String,
      default: null,
      maxlength: 100,
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },
    requestId: {
      type: String,
      default: null,
      maxlength: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ createdAt: -1, _id: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
