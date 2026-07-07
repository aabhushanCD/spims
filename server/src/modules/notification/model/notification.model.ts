import { Document, model, Schema, Types } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  status: "Pending" | "Sent" | "Failed";
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
  },
  { timestamps: true },
);

const NotificationModel = model<INotification>(
  "Notification",
  NotificationSchema,
);

export default NotificationModel;
