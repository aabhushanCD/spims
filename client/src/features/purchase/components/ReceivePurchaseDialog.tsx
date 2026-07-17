import { useEffect } from "react";
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

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  purchase: any;
}

export default function ReceivePurchaseDialog({
  open,
  onOpenChange,
  purchase,
}: Props) {
  const receivePurchase = useReceivePurchase();

  const form = useForm<ReceivePurchaseForm>({
    resolver: zodResolver(
      receivePurchaseSchema,
    ) as Resolver<ReceivePurchaseForm>,

    defaultValues: {
      items: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });
  console.log(purchase)

  useEffect(() => {
    if (!purchase) return;

    form.reset({
      items: purchase?.data?.items.map((item: any) => ({
        medicineId: item.medicine._id,

        medicineName: item.medicine.medicineName,

        quantityOrdered: item.quantity,

        quantityReceived: item.quantity,

        purchasePrice: item.purchasePrice,

        batchNumber: "",

        manufacturingDate: "",

        expiryDate: "",

        sellingPrice: item.purchasePrice,
      })),
    });
  }, [purchase, form]);
  function onSubmit(values: ReceivePurchaseForm) {
    console.log(values);
    receivePurchase.mutate(
      {
        id: purchase.data._id,

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
            <ReceivePurchaseTable control={form.control} fields={fields} />

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
