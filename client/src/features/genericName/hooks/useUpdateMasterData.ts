import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";
import type { MasterDataForm } from "../schema/masterData.schema";


interface UpdatePayload {
  id: string;
  data: MasterDataForm;
}

export function useUpdateMasterData(resource: MasterDataResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePayload) =>
      masterDataService.update(resource, id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
    },
  });
}
