import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";
import type { MasterDataForm } from "../schema/masterData.schema";

export function useCreateMasterData(resource: MasterDataResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MasterDataForm) =>
      masterDataService.create(resource, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
    },
  });
}
