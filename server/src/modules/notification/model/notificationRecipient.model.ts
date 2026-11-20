import { Document, model, Schema, Types } from "mongoose";

export type NotificationRecipientStatus =
  | "Pending"
  | "Sent"
  | "Failed"
  | "Skipped";

export interface INotificationRecipient extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  sentAt: Date | null;
  status: NotificationRecipientStatus;
  error: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Failed", "Skipped"],
      default: "Pending",
    },
    error: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    nextAttemptAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NotificationRecipientSchema.index(
  { notificationId: 1, userId: 1 },
  { unique: true },
);
NotificationRecipientSchema.index({ userId: 1, createdAt: -1, _id: -1 });
NotificationRecipientSchema.index({ status: 1, nextAttemptAt: 1 });

const NotificationRecipientModel = model<INotificationRecipient>(
  "NotificationRecipient",
  NotificationRecipientSchema,
);

export default NotificationRecipientModel;
