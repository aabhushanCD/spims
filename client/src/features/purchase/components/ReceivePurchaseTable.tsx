import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import type { Control, FieldArrayWithId } from "react-hook-form";
import type { ReceivePurchaseForm } from "../schema/receivePurchase.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  control: Control<ReceivePurchaseForm>;
  fields: (FieldArrayWithId<ReceivePurchaseForm, "items", "id"> & {
    medicineName?: string;
    quantityOrdered?: number;
    quantityRemaining?: number;
    purchasePrice?: number;
  })[];
  onAddBatch: (index: number) => void;
  onRemove: (index: number) => void;
}

export default function ReceivePurchaseTable({
  control,
  fields,
  onAddBatch,
  onRemove,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Ordered</TableHead>
          <TableHead>Remaining</TableHead>
          <TableHead>Receiving</TableHead>
          <TableHead>Purchase Price</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Mfg Date</TableHead>
          <TableHead>Selling Price</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {fields.map((field, index) => (
          <TableRow key={field.id}>
            <TableCell>{field.medicineName}</TableCell>
            <TableCell>{field.quantityOrdered}</TableCell>
            <TableCell>{field.quantityRemaining}</TableCell>
            <TableCell>
              <FormField
                control={control}
                name={`items.${index}.quantityReceived`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={fields[index].quantityRemaining}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TableCell>

            <TableCell>Rs. {field.purchasePrice}</TableCell>
            <TableCell>
              <FormField
                control={control}
                name={`items.${index}.batchNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Batch Number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TableCell>

            <TableCell>
              <FormField
                control={control}
                name={`items.${index}.expiryDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TableCell>

            <TableCell>
              <FormField
                control={control}
                name={`items.${index}.manufacturingDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TableCell>

            <TableCell>
              <FormField
                control={control}
                name={`items.${index}.sellingPrice`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TableCell>

            <TableCell>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => onAddBatch(index)}
                  aria-label={`Add another batch for ${field.medicineName}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove receipt line for ${field.medicineName}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
