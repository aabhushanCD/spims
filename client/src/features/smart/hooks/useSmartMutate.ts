import { useMutation, useQueryClient } from "@tanstack/react-query";
import { smartReorderService } from "../services/smart.service";

export const useApproveRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: smartReorderService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-reorders"] });
      queryClient.invalidateQueries({
        queryKey: ["smart-reorders", "pending"],
      });
    },
  });
};
