import { useQuery } from "@tanstack/react-query";

import { medicineServices } from "../services/medicine.service";

export function useMedicines() {
  return useQuery({
    queryKey: ["medicines"],
    queryFn: medicineServices.getMedicines,

  
  });
}
