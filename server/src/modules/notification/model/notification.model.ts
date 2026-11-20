import { Document, model, Schema } from "mongoose";

export type NotificationStatus = "Pending" | "Sent" | "Failed";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  status: NotificationStatus;
  isCritical: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["Email", "SMS", "InApp"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Pending",
    },
    isCritical: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

NotificationSchema.index({ createdAt: -1, _id: -1 });

const NotificationModel = model<INotification>(
  "Notification",
  NotificationSchema,
);

export default NotificationModel;
