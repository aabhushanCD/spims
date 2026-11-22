import { useEffect, useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Form } from "@/components/ui/form";

import {
  receivePurchaseSchema,
  type ReceivePurchaseForm,
} from "../schema/receivePurchase.schema";

import { useReceivePurchase } from "../hooks/useReceivePurchase";
import ReceivePurchaseTable from "./ReceivePurchaseTable";
import ReceivePurchaseFooter from "./ReceivePurchaseFooter";
import { validateReceiptTotals } from "../lib/receiptRows";
import type { PurchaseDetails } from "../types/PurchaseDetails";

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  purchase?: PurchaseDetails;
}

export default function ReceivePurchaseDialog({
  open,
  onOpenChange,
  purchase,
}: Props) {
  const receivePurchase = useReceivePurchase();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ReceivePurchaseForm>({
    resolver: zodResolver(
      receivePurchaseSchema,
    ) as Resolver<ReceivePurchaseForm>,

    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!purchase) return;

    form.reset({
      items: purchase.items
        .filter((item) => item.quantityRemaining > 0)
        .map((item) => ({
          purchaseOrderItemId: item._id,

          medicineId: item.medicine._id,

          medicineName: item.medicine.medicineName,

          quantityOrdered: item.quantity,

          quantityRemaining: item.quantityRemaining,

          quantityReceived: item.quantityRemaining,

          purchasePrice: item.purchasePrice,

          batchNumber: "",

          manufacturingDate: "",

          expiryDate: "",

          sellingPrice: item.purchasePrice,

          remarks: "",
        })),
    });
  }, [purchase, form]);

  function handleAddBatch(index: number) {
    const current = form.getValues(`items.${index}`);
    if (!current) return;

    append({
      ...current,
      quantityReceived: 1,
      batchNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      remarks: "",
    });
  }

  function onSubmit(values: ReceivePurchaseForm) {
    if (!purchase) return;

    const remainingById = new Map(
      purchase.items.map((item) => [item._id, item.quantityRemaining]),
    );
    const labels = new Map(
      purchase.items.map((item) => [
        item._id,
        item.medicine.medicineName,
      ]),
    );

    const totalError = validateReceiptTotals(
      values.items,
      remainingById,
      labels,
    );
    if (totalError) {
      setFormError(totalError);
      return;
    }

    const batchKeys = values.items.map(
      (item) => `${item.purchaseOrderItemId}:${item.batchNumber}`,
    );
    if (new Set(batchKeys).size !== batchKeys.length) {
      setFormError(
        "Each batch number must be unique within the same purchase order item",
      );
      return;
    }

    setFormError(null);
    receivePurchase.mutate(
      {
        id: purchase._id,

        data: values,
      },
      {
        onSuccess: () => {
          onOpenChange(false);

          form.reset();
        },
      },
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl">
        <DialogHeader>
          <DialogTitle>Receive Purchase</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ReceivePurchaseTable
              control={form.control}
              fields={fields}
              onAddBatch={handleAddBatch}
              onRemove={remove}
            />

            {formError && (
              <p className="text-destructive text-sm">{formError}</p>
            )}

            <ReceivePurchaseFooter
              loading={receivePurchase.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
