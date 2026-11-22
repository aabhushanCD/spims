import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { notificationTemplateService } from "../services/notificationTemplate.service";
import type {
  NotificationTemplateInput,
  RenderedTemplate,
} from "../types/notificationTemplate.types";

export const templateKeys = {
  all: ["notification-templates"] as const,
};

export function useNotificationTemplates() {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: notificationTemplateService.getTemplates,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NotificationTemplateInput) =>
      notificationTemplateService.createTemplate(data),
    onSuccess: () => {
      toast.success("Template created");
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create template"));
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NotificationTemplateInput>;
    }) => notificationTemplateService.updateTemplate(id, data),
    onSuccess: () => {
      toast.success("Template updated");
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update template"));
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationTemplateService.deleteTemplate,
    onSuccess: () => {
      toast.success("Template deleted");
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete template"));
    },
  });
}

export function useRenderTemplate() {
  return useMutation<RenderedTemplate, unknown, {
    id: string;
    data: Record<string, string | number | boolean>;
  }>({
    mutationFn: ({ id, data }) =>
      notificationTemplateService.renderTemplate(id, data),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to render template"));
    },
  });
}
