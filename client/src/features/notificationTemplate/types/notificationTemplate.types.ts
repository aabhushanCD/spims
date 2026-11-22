import type { NotificationChannel } from "@/features/notification/types/notification.types";

export interface NotificationTemplate {
  _id: string;
  key: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateInput {
  key: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  isActive?: boolean;
}

export interface RenderedTemplate {
  key: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
}
