import { useQuery } from "@tanstack/react-query";

import { customerService } from "../services/customer.service";

export const customerKeys = {
  all: ["customers"] as const,
  list: (search: string) => [...customerKeys.all, "list", search] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers(search = "") {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: () => customerService.getCustomers(search),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customerService.getCustomerById(id ?? ""),
    enabled: Boolean(id),
  });
}
