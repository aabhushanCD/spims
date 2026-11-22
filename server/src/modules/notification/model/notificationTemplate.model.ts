import { Schema, model, type Document } from "mongoose";

export interface INotificationTemplate extends Document {
  key: string;
  name: string;
  channel: "Email" | "SMS" | "InApp";
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    channel: { type: String, enum: ["Email", "SMS", "InApp"], required: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 5000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const NotificationTemplate = model<INotificationTemplate>(
  "NotificationTemplate",
  notificationTemplateSchema,
);

export default NotificationTemplate;
