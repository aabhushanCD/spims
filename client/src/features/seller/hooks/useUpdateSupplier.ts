import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierService.updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
    },
  });
};
