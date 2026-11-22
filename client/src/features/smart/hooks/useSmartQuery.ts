import { useQuery } from "@tanstack/react-query";
import { smartReorderService } from "../services/smart.service";
import type { ReorderListStatus } from "../types/smart.types";

const allSmartReorders = ["smart-reorders"] as const;

export const smartKeys = {
  all: allSmartReorders,
  list: (status: ReorderListStatus) =>
    [...allSmartReorders, "list", status] as const,
  pending: [...allSmartReorders, "pending"] as const,
};

export const useGetPendingRecommendations = () =>
  useQuery({
    queryKey: smartKeys.pending,
    queryFn: smartReorderService.getPending,
  });

export const useGetRecommendations = (status?: ReorderListStatus) =>
  useQuery({
    queryKey: status
      ? smartKeys.list(status)
      : [...smartKeys.all, "list", "PENDING"],
    queryFn: () => smartReorderService.getAll(status),
  });
