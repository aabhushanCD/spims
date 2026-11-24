import { useQuery } from "@tanstack/react-query";

import { configService } from "../services/config.service";

export const workspaceConfigKeys = {
  all: ["workspace-config"] as const,
};

export function useWorkspaceConfig() {
  return useQuery({
    queryKey: workspaceConfigKeys.all,
    queryFn: configService.getWorkspaceConfig,
    staleTime: Infinity,
    retry: 1,
  });
}
