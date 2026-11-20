import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import { notificationService } from "../services/notification.service";
import type {
  NotificationPreferences,
  UpdatePreferencesInput,
} from "../types/notification.types";
import { notificationKeys } from "./notificationKeys";

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdatePreferencesInput) =>
      notificationService.updatePreferences(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.preferences(),
      });

      const previous =
        queryClient.getQueryData<NotificationPreferences>(
          notificationKeys.preferences(),
        );

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          notificationKeys.preferences(),
          { ...previous, ...patch },
        );
      }

      return { previous };
    },
    onError: (error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          notificationKeys.preferences(),
          context.previous,
        );
      }

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to update notification preferences.",
        ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(),
      });
    },
  });
}
