import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PurchaseInformation from "./PurchaseInformation";
import PurchaseItemsTable from "./PurchaseItemsTable";

import PurchaseFooter from "./PurchaseFooter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Form } from "@/components/ui/form";

import { purchaseSchema, type PurchaseForm } from "../schema/purchase.schema";

import { Button } from "@/components/ui/button";
import { useCreatePurchase } from "../hooks/useCreatePurchase";
import { useEffect } from "react";
import { usePurchase } from "../hooks/usePurchase";
import { useUpdatePurchaseItems } from "../hooks/useUpdatePurchase";
import type { PurchaseListItem } from "../types/purchase.types";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingPurchase?: PurchaseListItem | null;
}

const defaultValues: PurchaseForm = {
  supplierId: "",
  VAT: 13,
  discount: 0,
  orderDate: new Date(),
  expectedDeliveryDate: undefined,
  invoiceNumber: "",
  invoiceFile: "",
  items: [
    {
      medicineId: "",
      quantity: 1,
      purchasePrice: 0,
    },
  ],
};

export default function PurchaseDialog({
  open,
  onOpenChange,
  editingPurchase,
}: Props) {
  const createPurchase = useCreatePurchase();

  const purchase = usePurchase(editingPurchase?._id || undefined);
  const updatePurchaseItems = useUpdatePurchaseItems();
  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema) as Resolver<PurchaseForm>,
    defaultValues,
  });

  useEffect(() => {
    if (!editingPurchase || !purchase.data) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      supplierId: purchase.data.supplier._id,
      VAT: purchase.data.VAT,
      discount: purchase.data.discount,
      orderDate: new Date(purchase.data.orderDate),
      expectedDeliveryDate: purchase.data.expectedDeliveryDate
        ? new Date(purchase.data.expectedDeliveryDate)
        : undefined,
      invoiceNumber: purchase.data.invoiceNumber,
      invoiceFile: purchase.data.invoiceFile,
      items: purchase.data.items.map((item) => ({
        purchaseOrderItemId: item._id,
        medicineId: item.medicine._id,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
      })),
    });
  }, [editingPurchase, purchase.data, form]);

  const fieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: PurchaseForm) {
    if (editingPurchase) {
      if (!purchase.data || purchase.data.status !== "pending") {
        return;
      }

      await updatePurchaseItems.mutateAsync({
        id: editingPurchase._id,
        items: values.items,
        originalItems: purchase.data.items,
      });
    } else {
      await createPurchase.mutateAsync(values);
    }

    form.reset(defaultValues);
    onOpenChange?.(false);
  }

  const isEditing = Boolean(editingPurchase);
  const canEditItems =
    !isEditing || purchase.data?.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingPurchase && (
        <DialogTrigger asChild>
          <Button variant="secondary">Create Purchase Order</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Purchase Order — items only"
              : "Create Purchase Order"}
          </DialogTitle>
        </DialogHeader>

        {isEditing && (
          <p className="text-muted-foreground text-sm">
            Header fields cannot be changed after creation. Only the item
            quantities, prices, and lines can be edited.
          </p>
        )}

        {!canEditItems && (
          <p className="text-muted-foreground text-sm">
            Only pending purchase orders can be edited. This order is{" "}
            <span className="font-medium">{purchase.data?.status}</span>.
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={isEditing}>
              <PurchaseInformation form={form} />
            </fieldset>

            <fieldset disabled={!canEditItems}>
              <PurchaseItemsTable
                form={form}
                fieldArray={fieldArray}
                lockExistingMedicines={isEditing || !canEditItems}
              />
            </fieldset>

            <PurchaseFooter
              isLoading={
                createPurchase.isPending || updatePurchaseItems.isPending
              }
              submitLabel={isEditing ? "Save Changes" : "Draft Purchase"}
              disabled={!canEditItems}
              onCancel={() => onOpenChange?.(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
