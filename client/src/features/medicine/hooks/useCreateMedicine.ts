import { useMutation, useQueryClient } from "@tanstack/react-query";

import { medicineServices } from "../services/medicine.service";

export function useCreateMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicineServices.createMedicine,

    onSuccess: () => {
      console.log("Medicine created successfully");
      queryClient.invalidateQueries({
        queryKey: ["medicines"],
      });
    },
  });
}
