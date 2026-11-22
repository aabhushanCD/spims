import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  NotificationTemplate,
  NotificationTemplateInput,
  RenderedTemplate,
} from "../types/notificationTemplate.types";

const getTemplates = async (): Promise<NotificationTemplate[]> => {
  const response = await api.get<ApiResponse<NotificationTemplate[]>>(
    "/notification-templates",
  );
  return response.data.data;
};

const createTemplate = async (
  data: NotificationTemplateInput,
): Promise<NotificationTemplate> => {
  const response = await api.post<ApiResponse<NotificationTemplate>>(
    "/notification-templates",
    data,
  );
  return response.data.data;
};

const updateTemplate = async (
  id: string,
  data: Partial<NotificationTemplateInput>,
): Promise<NotificationTemplate> => {
  const response = await api.put<ApiResponse<NotificationTemplate>>(
    `/notification-templates/${id}`,
    data,
  );
  return response.data.data;
};

const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/notification-templates/${id}`);
};

const renderTemplate = async (
  id: string,
  data: Record<string, string | number | boolean>,
): Promise<RenderedTemplate> => {
  const response = await api.post<ApiResponse<RenderedTemplate>>(
    `/notification-templates/${id}/render`,
    { data },
  );
  return response.data.data;
};

export const notificationTemplateService = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  renderTemplate,
};
