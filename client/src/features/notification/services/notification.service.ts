import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  InboxPage,
  InboxParams,
  MarkAllReadResult,
  MarkReadResult,
  NotificationPreferences,
  UpdatePreferencesInput,
} from "../types/notification.types";

const getInbox = async (params: InboxParams): Promise<InboxPage> => {
  const response = await api.get<ApiResponse<InboxPage>>("/notifications/me", {
    params,
  });
  return response.data.data;
};

const markRead = async (notificationId: string): Promise<MarkReadResult> => {
  const response = await api.patch<ApiResponse<MarkReadResult>>(
    `/notifications/me/${notificationId}/read`,
  );
  return response.data.data;
};

const markAllRead = async (): Promise<MarkAllReadResult> => {
  const response = await api.patch<ApiResponse<MarkAllReadResult>>(
    "/notifications/me/read-all",
  );
  return response.data.data;
};

const getPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get<ApiResponse<NotificationPreferences>>(
    "/notifications/preferences/me",
  );
  return response.data.data;
};

const updatePreferences = async (
  patch: UpdatePreferencesInput,
): Promise<NotificationPreferences> => {
  const response = await api.patch<ApiResponse<NotificationPreferences>>(
    "/notifications/preferences/me",
    patch,
  );
  return response.data.data;
};

const getPreferencesForUser = async (
  userId: string,
): Promise<NotificationPreferences> => {
  const response = await api.get<ApiResponse<NotificationPreferences>>(
    `/notifications/preferences/${userId}`,
  );
  return response.data.data;
};

const updatePreferencesForUser = async (
  userId: string,
  patch: UpdatePreferencesInput,
): Promise<NotificationPreferences> => {
  const response = await api.patch<ApiResponse<NotificationPreferences>>(
    `/notifications/preferences/${userId}`,
    patch,
  );
  return response.data.data;
};

export const notificationService = {
  getInbox,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
  getPreferencesForUser,
  updatePreferencesForUser,
};
