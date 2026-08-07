import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";
import type { MasterDataForm } from "../schema/masterData.schema";
import { toast } from "react-toastify";


export function useCreateMasterData(resource: MasterDataResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MasterDataForm) =>
      masterDataService.create(resource, data),

    onSuccess: () => {
      toast.success(`Successfully created ${resource}`);
      queryClient.invalidateQueries({
        queryKey: [resource],
      });
    },
  });
}
