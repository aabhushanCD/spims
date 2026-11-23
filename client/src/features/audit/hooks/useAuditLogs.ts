import { useInfiniteQuery } from "@tanstack/react-query";

import { auditService } from "../services/audit.service";
import type { AuditFilterInput } from "../lib/auditQuery";

export function useAuditLogs(filters: AuditFilterInput) {
  return useInfiniteQuery({
    queryKey: ["audit", filters],
    queryFn: ({ pageParam }) => auditService.getAuditLogs(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
