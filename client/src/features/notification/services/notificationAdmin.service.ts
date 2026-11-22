import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  AdminNotification,
  AdminNotificationDetail,
  AdminNotificationPage,
  AdminNotificationParams,
  CreateNotificationInput,
} from "../types/notification.types";

const getNotifications = async (
  params: AdminNotificationParams = {},
): Promise<AdminNotificationPage> => {
  const response = await api.get<ApiResponse<AdminNotificationPage>>(
    "/notifications",
    {
      params: {
        limit: params.limit ?? 20,
        ...(params.cursor ? { cursor: params.cursor } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.type ? { type: params.type } : {}),
      },
    },
  );
  return response.data.data;
};

const getNotificationById = async (
  id: string,
): Promise<AdminNotificationDetail> => {
  const response = await api.get<ApiResponse<AdminNotificationDetail>>(
    `/notifications/${id}`,
  );
  return response.data.data;
};

const createNotification = async (
  data: CreateNotificationInput,
): Promise<AdminNotification> => {
  const response = await api.post<ApiResponse<AdminNotification>>(
    "/notifications",
    data,
  );
  return response.data.data;
};

const dispatchNotification = async (
  id: string,
  force = false,
): Promise<AdminNotification> => {
  const response = await api.post<ApiResponse<AdminNotification>>(
    `/notifications/${id}/dispatch`,
    {},
    { params: force ? { force: true } : {} },
  );
  return response.data.data;
};

const retryNotification = async (
  id: string,
): Promise<AdminNotification> => {
  const response = await api.post<ApiResponse<AdminNotification>>(
    `/notifications/${id}/retry`,
  );
  return response.data.data;
};

const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const notificationAdminService = {
  getNotifications,
  getNotificationById,
  createNotification,
  dispatchNotification,
  retryNotification,
  deleteNotification,
};
