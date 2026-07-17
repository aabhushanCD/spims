// features/sales/components/MedicineSearch.tsx
import { useRef, useState } from "react";
import { Search, ScanBarcode, Loader2, PackageX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type {
  InventorySearchResult,
 
} from "../types/sale.types";
import { cn } from "@/lib/utils";
import { salesService } from "../services/sales.service";

interface MedicineSearchProps {
  onSelect: (medicine: InventorySearchResult) => void;
  selectedIds?: string[];
}

export function MedicineSearch({
  onSelect,
  selectedIds = [],
}: MedicineSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["medicines", "search", debouncedQuery],
    queryFn: () => salesService.searchMedicines(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });

  // const handleSelect = (medicine: MedicineOption) => {
  //   if (medicine.stockQuantity <= 0) return;
  //   onSelect(medicine);
  //   setQuery("");
  //   setOpen(false);
  //   setActiveIndex(0);
  //   inputRef.current?.focus();
  // };
  const handleSelect = (medicine: InventorySearchResult) => {
    if (medicine.availableStock <= 0) return;

    onSelect(medicine);

    setQuery("");
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.focus();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = results[activeIndex];
      if (chosen) handleSelect(chosen);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open && query.trim().length > 0}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search medicine by name, generic name, or scan barcode..."
            className="h-11 pr-9 pl-9 text-base"
            autoComplete="off"
          />
          <ScanBarcode className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isFetching && (
          <div className="text-muted-foreground flex items-center gap-2 px-3 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        )}

        {!isFetching && results.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-1 px-3 py-6 text-sm">
            <PackageX className="h-5 w-5" />
            No medicines found for "{debouncedQuery}"
          </div>
        )}

        {!isFetching &&
          results.map((medicine: InventorySearchResult, index: number) => {
            const outOfStock = medicine.availableStock <= 0;

            const alreadyInCart = selectedIds.includes(medicine.medicine._id);

            return (
              <button
                key={medicine._id}
                type="button"
                disabled={outOfStock}
                onClick={() => handleSelect(medicine)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex && "bg-accent",
                  outOfStock && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {medicine.medicine.medicineName}
                    </span>

                    {medicine.medicine.strength && (
                      <span className="text-muted-foreground text-xs">
                        {medicine.medicine.strength}
                      </span>
                    )}

                    {alreadyInCart && (
                      <Badge variant="secondary" className="text-[10px]">
                        In cart
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground truncate text-xs">
                    Batch: {medicine.nextBatch.batchNumber}
                  </p>

                  <p className="text-muted-foreground truncate text-xs">
                    Exp:{" "}
                    {new Date(
                      medicine.nextBatch.expiryDate,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-medium">
                    Rs. {medicine.nextBatch.sellingPrice.toFixed(2)}
                  </span>

                  <span
                    className={cn(
                      "text-xs",
                      outOfStock ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {outOfStock
                      ? "Out of stock"
                      : `${medicine.availableStock} in stock`}
                  </span>
                </div>
              </button>
            );
          })}
      </PopoverContent>
    </Popover>
  );
}
