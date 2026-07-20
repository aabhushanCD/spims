import { useQuery } from "@tanstack/react-query";
import { smartReorderService } from "../services/smart.service";

export const useGetPendingRecommendations = () =>
  useQuery({
    queryKey: ["smart-reorders", "pending"],
    queryFn: smartReorderService.getPending,
  });

export const useGetRecommendations = () =>
  useQuery({
    queryKey: ["smart-reorders"],
    queryFn: smartReorderService.getAll,
  });
