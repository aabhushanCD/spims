// features/sales/hooks/useSale.ts
import { useQuery } from "@tanstack/react-query";

import { saleKeys } from "./useSales";
import { salesService } from "../services/sales.service";

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: saleKeys.detail(id ?? ""),
    queryFn: () => salesService.getSaleById(id as string),
    enabled: Boolean(id),
  });
}
