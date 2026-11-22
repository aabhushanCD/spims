import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/inventory.service";

export const useInventory = (search = "") => {
  return useQuery({
    queryKey: ["inventory", search],
    queryFn: () =>
      search.trim()
        ? inventoryService.getInventory(search.trim())
        : inventoryService.getAllInventories(),
  });
};
