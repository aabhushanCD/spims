import { useQuery } from "@tanstack/react-query";

import { masterDataService } from "../services/masterData.service";

import type { MasterDataResource } from "../types/masterData.types";

export function useMasterData(resource: MasterDataResource) {
  return useQuery({
    queryKey: [resource],

    queryFn: () => masterDataService.getAll(resource),
  });
}
