import { useQuery } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";

export const useSupplier = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierService.getSupplier,
  });
};
