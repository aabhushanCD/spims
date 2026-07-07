import { Document, model, Schema, Types } from "mongoose";

export interface INotificationRecipient extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  sentAt: Date;
  status: "Pending" | "Sent" | "Failed";
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>({
  notificationId: {
    type: Schema.Types.ObjectId,
    ref: "Notification",
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "Sent", "Failed"],
    default: "Pending",
  },
});

const NotificationRecipientModel = model<INotificationRecipient>(
  "NotificationRecipient",
  NotificationRecipientSchema,
);

export default NotificationRecipientModel;
