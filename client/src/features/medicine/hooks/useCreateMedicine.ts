import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { medicineServices } from "../services/medicine.service";

export function useCreateMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicineServices.createMedicine,

    onSuccess: () => {
      toast.success("Medicine created successfully");
      queryClient.invalidateQueries({
        queryKey: ["medicines"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}
