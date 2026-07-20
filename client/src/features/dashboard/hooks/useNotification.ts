import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export const useNotification = () => {
  return useQuery({
    queryKey: ["notification"],
    queryFn: dashboardService.getNotification,
  });
};
