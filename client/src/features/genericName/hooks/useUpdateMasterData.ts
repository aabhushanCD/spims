import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";
import type { MasterDataForm } from "../schema/masterData.schema";
import { toast } from "react-toastify";

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
      toast.success(`Successfully updated ${resource}`);
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
    },
    onError: (error) => {
      toast.error(`Failed to update ${resource}: ${error.message}`);
    },
  });
}
