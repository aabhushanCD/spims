import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";

export function useDeleteMasterData(resource: MasterDataResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => masterDataService.remove(resource, id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
    },
  });
}
