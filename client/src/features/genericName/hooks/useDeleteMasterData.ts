import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";
import { toast } from "react-toastify";

export function useDeleteMasterData(resource: MasterDataResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => masterDataService.remove(resource, id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
      toast.success(`Successfully deleted ${resource}`);
    },
    onError: (error) => {
      toast.error(`Failed to delete ${resource}: ${error.message}`);
    },
  });
}
