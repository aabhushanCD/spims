import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { notificationService } from "../services/notification.service";
import { notificationKeys } from "./notificationKeys";

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: (result) => {
      toast.success(
        result.updated > 0
          ? "All notifications marked as read."
          : "No unread notifications.",
      );
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.inboxes(),
      });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to mark all notifications as read.",
        ),
      );
    },
  });
}
