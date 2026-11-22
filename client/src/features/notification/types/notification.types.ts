export type NotificationChannel = "Email" | "SMS" | "InApp";
export type DeliveryStatus = "Pending" | "Sent" | "Failed";
export type RecipientStatus = "Pending" | "Sent" | "Failed" | "Skipped";

/**
 * A row from the current user's inbox (`GET /notifications/me`).
 *
 * `_id` is the parent notification id, which is what
 * `PATCH /notifications/me/:id/read` expects. It is never a recipient id.
 *
 * Named `InboxNotification` so it does not collide with the DOM `Notification`
 * global.
 */
export interface InboxNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationChannel;
  status: DeliveryStatus;
  recipientStatus: RecipientStatus;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboxPage {
  items: InboxNotification[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface InboxParams {
  cursor?: string;
  limit: number;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
}

export type UpdatePreferencesInput = Partial<NotificationPreferences>;

export interface MarkReadResult {
  readAt: string | null;
}

export interface MarkAllReadResult {
  updated: number;
}

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationChannel;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotificationPage {
  items: AdminNotification[];
  nextCursor: string | null;
}

export interface AdminNotificationParams {
  cursor?: string;
  limit?: number;
  status?: DeliveryStatus;
  type?: NotificationChannel;
}

export interface NotificationRecipient {
  _id: string;
  userId: string;
  status: RecipientStatus;
  sentAt: string | null;
  readAt: string | null;
  error?: string | null;
  attempts?: number;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
}

export interface AdminNotificationDetail extends AdminNotification {
  recipients: NotificationRecipient[];
}

export interface CreateNotificationInput {
  title?: string;
  message?: string;
  templateKey?: string;
  templateData?: Record<string, string | number | boolean>;
  type: NotificationChannel;
  userIds: string[];
}
