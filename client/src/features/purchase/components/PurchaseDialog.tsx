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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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


export default function PurchaseDialog({ open, onOpenChange }: Props) {
  const createPurchase = useCreatePurchase();
  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema) as Resolver<PurchaseForm>,
    defaultValues,
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: PurchaseForm) {
    await createPurchase.mutateAsync(values);

    form.reset(defaultValues);

    onOpenChange(false);
  }
  console.log("form", form.formState.errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">Create Purchase Order</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <PurchaseInformation form={form} />

            <PurchaseItemsTable form={form} fieldArray={fieldArray} />

            <PurchaseFooter
              isLoading={createPurchase.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
