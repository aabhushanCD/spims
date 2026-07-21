import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/inventory.service";

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: inventoryService.getAllInventories,
  });
  
};
