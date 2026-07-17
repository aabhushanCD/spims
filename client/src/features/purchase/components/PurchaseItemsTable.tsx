import { Plus } from "lucide-react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PurchaseForm } from "../schema/purchase.schema";
import PurchaseItemRow from "./PurchaseItemRow";

interface Props {
  form: UseFormReturn<PurchaseForm>;
  fieldArray: UseFieldArrayReturn<PurchaseForm, "items">;
}

export default function PurchaseItemsTable({ form, fieldArray }: Props) {
  const { fields, append, remove } = fieldArray;

  const items = form.watch("items");

  const grandTotal = items?.reduce(
    (total, item) => total + item.quantity * item.purchasePrice,
    0,
  );

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Purchase Items</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Table Header */}

        <div className="text-muted-foreground grid grid-cols-12 gap-3 border-b pb-2 text-sm font-semibold">
          <div className="col-span-5">Medicine</div>

          <div className="col-span-2">Quantity</div>

          <div className="col-span-2">Purchase Price</div>

          <div className="col-span-2">Total</div>

          <div className="col-span-1"></div>
        </div>

        {/* Rows */}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <PurchaseItemRow
              key={field.id}
              form={form}
              index={index}
              remove={remove}
              canDelete={fields.length > 1}
            />
          ))}
        </div>

        {/* Add Button */}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            append({
              medicineId: "",
              quantity: 1,
              purchasePrice: 0,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>

        {/* Grand Total */}

        <div className="flex justify-end border-t pt-4">
          <div className="text-lg font-bold">
            Grand Total: Rs. {grandTotal?.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
