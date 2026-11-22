import { useInfiniteQuery } from "@tanstack/react-query";

import { medicineServices } from "../services/medicine.service";

export function useMedicineList(search = "") {
  return useInfiniteQuery({
    queryKey: ["medicines", "list", search],
    queryFn: ({ pageParam }) =>
      medicineServices.getMedicinePage(search, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
