import { useQuery } from "@tanstack/react-query";

import { notificationService } from "../services/notification.service";
import { notificationKeys } from "./notificationKeys";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationService.getPreferences(),
    staleTime: 30_000,
  });
}
