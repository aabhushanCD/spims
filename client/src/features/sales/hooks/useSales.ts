// features/sales/hooks/useSales.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { SalesQueryParams } from "../types/sale.types";
import { salesService } from "../services/sales.service";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: SalesQueryParams) => [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

export function useSales(params: SalesQueryParams = {}) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: () => salesService.getSales(params),
    placeholderData: keepPreviousData,
  });
}
