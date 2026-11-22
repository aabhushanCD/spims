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

interface Props {
  control: Control<ReceivePurchaseForm>;

  fields: (FieldArrayWithId<ReceivePurchaseForm, "items", "id"> & {
    medicineName?: string;
    quantityOrdered?: number;
    quantityRemaining?: number;
    purchasePrice?: number;
  })[];
}

export default function ReceivePurchaseTable({ control, fields }: Props) {
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
