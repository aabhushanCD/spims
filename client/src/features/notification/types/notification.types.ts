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
