import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { notificationAdminService } from "../services/notificationAdmin.service";
import type {
  AdminNotificationParams,
  CreateNotificationInput,
} from "../types/notification.types";

export const adminNotificationKeys = {
  all: ["notifications", "admin"] as const,
  list: (params: AdminNotificationParams) =>
    [...adminNotificationKeys.all, "list", params] as const,
  detail: (id: string) =>
    [...adminNotificationKeys.all, "detail", id] as const,
};

export function useAdminNotifications(params: AdminNotificationParams = {}) {
  return useInfiniteQuery({
    queryKey: adminNotificationKeys.list(params),
    queryFn: ({ pageParam }) =>
      notificationAdminService.getNotifications({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useAdminNotification(id: string | undefined) {
  return useQuery({
    queryKey: adminNotificationKeys.detail(id ?? ""),
    queryFn: () =>
      notificationAdminService.getNotificationById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useCreateAdminNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationInput) =>
      notificationAdminService.createNotification(data),
    onSuccess: () => {
      toast.success("Notification created and queued");
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create notification"));
    },
  });
}

export function useDispatchAdminNotification(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (force: boolean) =>
      notificationAdminService.dispatchNotification(id, force),
    onSuccess: () => {
      toast.success("Dispatch requested");
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to dispatch notification"));
    },
  });
}

export function useRetryAdminNotification(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationAdminService.retryNotification(id),
    onSuccess: () => {
      toast.success("Retry requested");
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to retry notification"));
    },
  });
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAdminService.deleteNotification,
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete notification"));
    },
  });
}
