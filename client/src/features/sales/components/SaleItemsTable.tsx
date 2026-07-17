// features/sales/components/SaleItemsTable.tsx
import {
  useFormContext,
  useWatch,
  type UseFieldArrayReturn,
} from "react-hook-form";
import { Trash2, PackagePlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SaleFormValues } from "../schema/sale.schema";

function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercentage: number,
  vatPercentage: number,
) {
  const base = quantity * unitPrice;
  const discount = base * (discountPercentage / 100);
  const taxable = base - discount;
  const vat = taxable * (vatPercentage / 100);
  return taxable + vat;
}
interface Props {
  fieldArray: UseFieldArrayReturn<SaleFormValues, "items">;
}

export function SaleItemsTable({ fieldArray }: Props) {
  const { control, register, formState } = useFormContext<SaleFormValues>();
  const { fields, remove } = fieldArray;
  const items = useWatch({ control, name: "items" });

  if (fields.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm">
        <PackagePlus className="h-6 w-6" />
        No items yet. Search a medicine above to add it to this sale.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-45">Medicine</TableHead>
            <TableHead className="w-24">Qty</TableHead>
            <TableHead className="w-28">Unit Price</TableHead>
            <TableHead className="w-24">Disc %</TableHead>
            <TableHead className="w-24">VAT %</TableHead>
            <TableHead className="w-28 text-right">Total</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const item = items?.[index];
            const lineTotal = item
              ? calculateLineTotal(
                  item.quantity || 0,
                  item.unitPrice || 0,
                  item.discountPercentage || 0,
                  item.vatPercentage || 0,
                )
              : 0;
            const quantityError = formState.errors.items?.[index]?.quantity;
            const maxStock = item?.availableStock;

            return (
              <TableRow key={field.id}>
                <TableCell>
                  <div className="font-medium">{item?.medicineName}</div>
                  {item?.batchNo && (
                    <div className="text-muted-foreground text-xs">
                      Batch: {item.batchNo}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={maxStock}
                    className="h-9 w-20"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  {quantityError && (
                    <p className="text-destructive mt-1 text-[11px]">
                      {quantityError.message as string}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-9 w-24"
                    {...register(`items.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className="h-9 w-20"
                    {...register(`items.${index}.discountPercentage`, {
                      valueAsNumber: true,
                    })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className="h-9 w-20"
                    {...register(`items.${index}.vatPercentage`, {
                      valueAsNumber: true,
                    })}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  Rs. {lineTotal.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label={`Remove ${item?.medicineName}`}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { calculateLineTotal };
