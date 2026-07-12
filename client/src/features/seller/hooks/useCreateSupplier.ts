import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierService.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
    },
  });
};
