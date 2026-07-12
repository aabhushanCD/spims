import { useMasterData } from "@/features/genericName/hooks/useMaterData";

export function useMedicineOptions() {
  const genericNames = useMasterData("generic-names");

  const brands = useMasterData("brands");

  const categories = useMasterData("categories");

  const units = useMasterData("units");

  
  return {
    genericNames,
    brands,
    categories,
    units,
  
  };
}
