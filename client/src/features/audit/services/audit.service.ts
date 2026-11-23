import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { AuditPage } from "../types/audit.types";
import { buildAuditParams, type AuditFilterInput } from "../lib/auditQuery";

const getAuditLogs = async (
  filters: AuditFilterInput,
  cursor?: string,
): Promise<AuditPage> => {
  const response = await api.get<ApiResponse<AuditPage>>("/audit", {
    params: {
      ...buildAuditParams(filters),
      ...(cursor ? { cursor } : {}),
    },
  });
  return response.data.data;
};

export const auditService = {
  getAuditLogs,
};
