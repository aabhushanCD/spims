import { api } from "@/api/apiClient";

export interface WorkspaceConfig {
  reportingTimeZone: string;
}

async function getWorkspaceConfig(): Promise<WorkspaceConfig> {
  const response = await api.get<WorkspaceConfig>("/config");
  return response.data;
}

export const configService = {
  getWorkspaceConfig,
};
