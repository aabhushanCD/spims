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
import { useUpdatePurchase } from "../hooks/useUpdatePurchase";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingPurchase?: any | null;
}

const defaultValues: PurchaseForm = {
  supplierId: "",
  VAT: 13,
  discount: 0,
  orderDate: new Date(),
  expectedDeliveryDate: new Date(),
  receivedDate: new Date(),
  invoiceNumber: "",
  invoiceFile: "",
  status: "pending",
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
  const updatePurchase = useUpdatePurchase();
  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema) as Resolver<PurchaseForm>,
    defaultValues,
  });

  useEffect(() => {
    if (!editingPurchase || !purchase.data.data) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      supplierId: { ...purchase.data.supplierId },
      VAT: purchase.data.data.VAT,
      discount: purchase.data.data.discount,
      orderDate: new Date(purchase.data.data.orderDate),
      expectedDeliveryDate: new Date(purchase.data.data.expectedDeliveryDate),
      receivedDate: new Date(purchase.data.data.receivedDate),
      invoiceNumber: purchase.data.data.invoiceNumber,
      invoiceFile: purchase.data.data.invoiceFile,
      status: purchase.data.data.status,
      items: purchase.data.data.items.map((item: any) => ({
        medicineId: item.medicine.medicineName,
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
      await updatePurchase.mutateAsync({
        id: editingPurchase._id,
        data: values,
      });
    } else {
      await createPurchase.mutateAsync(values);
    }

    form.reset(defaultValues);
    onOpenChange?.(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingPurchase && (
        <DialogTrigger asChild>
          <Button variant="secondary">Create Purchase Order</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <PurchaseInformation form={form} />

            <PurchaseItemsTable form={form} fieldArray={fieldArray} />

            <PurchaseFooter
              isLoading={createPurchase.isPending}
              onCancel={() => onOpenChange?.(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
