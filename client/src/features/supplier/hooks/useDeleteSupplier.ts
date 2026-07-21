import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierService.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
    },
  });
};
