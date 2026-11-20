import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/lib/apiError";
import {
  markNotificationReadInCache,
  type InboxCacheData,
} from "../lib/inboxCache";
import { notificationService } from "../services/notification.service";
import { notificationKeys } from "./notificationKeys";

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.inboxes(),
      });

      const snapshots = queryClient.getQueriesData<InboxCacheData>({
        queryKey: notificationKeys.inboxes(),
      });
      const optimisticReadAt = new Date().toISOString();

      for (const [queryKey, data] of snapshots) {
        if (!data) {
          continue;
        }
        queryClient.setQueryData<InboxCacheData>(
          queryKey,
          markNotificationReadInCache(data, notificationId, optimisticReadAt),
        );
      }

      return { snapshots };
    },
    onError: (error, _notificationId, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to mark the notification as read.",
        ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.inboxes(),
      });
    },
  });
}
