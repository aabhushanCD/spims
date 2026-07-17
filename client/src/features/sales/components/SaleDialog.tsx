// features/sales/components/SaleDialog.tsx
import { useCallback, useState } from "react";
import { useFieldArray, useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { saleFormSchema, type SaleFormValues } from "../schema/sale.schema";
import { SaleInformation } from "./SaleInformation";
import { MedicineSearch } from "./MedicineSearch";
import { SaleItemsTable } from "./SaleItemsTable";
import { SaleSummary, computeSaleTotals } from "./SaleSummary";
import { PaymentSection } from "./PaymentSection";
import { useCreateSale } from "../hooks/useCreateSale";
import type {
  CreateSaleInput,
  InventorySearchResult,
} from "../types/sale.types";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashierId: string;
}

const defaultValues: SaleFormValues = {
  customerName: "",
  customerPhone: "",
  paymentMethod: "Cash",
  discount: 0,
  paidAmount: undefined,
  notes: "",
  items: [],
};

export function SaleDialog({ open, onOpenChange }: SaleDialogProps) {
  const [grandTotal, setGrandTotal] = useState(0);
  const createSale = useCreateSale();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const fieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { handleSubmit, reset, watch } = form;
  const { append } = fieldArray;
  const currentItems = watch("items");

  const handleAddMedicine = useCallback(
    (medicine: InventorySearchResult) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.medicineId === medicine.medicineId,
      );

      if (existingIndex !== -1) {
        const existing = currentItems[existingIndex];

        form.setValue(
          `items.${existingIndex}.quantity`,
          Math.min(existing.quantity + 1, medicine.availableStock),
          { shouldValidate: true },
        );

        return;
      }

      append({
        medicineId: medicine.medicineId,
        batchId: medicine.nextBatch._id,
        batchNo: medicine.nextBatch.batchNumber,
        medicineName: medicine.medicine.medicineName,
        quantity: 1,
        unitPrice: medicine.nextBatch.sellingPrice,
        availableStock: medicine.availableStock,
        discountPercentage: 0,
        vatPercentage: 13, // or medicine.nextBatch.vatPercentage if returned
      });
    },
    [append, currentItems, form],
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset(defaultValues);
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: SaleFormValues) => {
    console.log("Submitting sale with values:", values);
    const payload: CreateSaleInput = {
      customerName: values.customerName,
      paymentMethod: values.paymentMethod,
      saleDate: new Date().toISOString(),
      discount: values.discount,
      items: values.items.map((item) => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        discountPercentage: item.discountPercentage,
      })),
    };

    createSale.mutate(payload, {
      onSuccess: () => handleClose(false),
    });
  };

  const selectedIds = currentItems?.map((item) => item.medicineId) ?? [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Sale</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1"
          >
            <SaleInformation />
            <Separator />

            <div className="space-y-3">
              <MedicineSearch
                onSelect={handleAddMedicine}
                selectedIds={selectedIds}
              />
              <SaleItemsTable fieldArray={fieldArray} />
              {form.formState.errors.items?.message && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.items.message}
                </p>
              )}
            </div>

            <SaleSummary
              onTotalsChange={(totals) => setGrandTotal(totals.grandTotal)}
            />

            <Separator />
            <PaymentSection grandTotal={grandTotal} />

            <DialogFooter className="mt-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={createSale.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSale.isPending}>
                {createSale.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Sale
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

// re-exported so the dialog's totals can be reused elsewhere without recompute
export { computeSaleTotals };
