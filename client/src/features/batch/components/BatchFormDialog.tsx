import { useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMedicines } from "@/features/medicine/hooks/useMedicines";
import { usePurchases } from "@/features/purchase/hooks/usePurchases";
import {
  createBatchFormSchema,
  updateBatchFormSchema,
} from "../schema/batch.schema";
import type { Batch } from "../types/batch.types";
import { useCreateBatch, useUpdateBatch } from "../hooks/useMutateBatch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBatch?: Batch | null;
  hideTrigger?: boolean;
}

interface BatchFormValues {
  purchaseOrderId?: string;
  medicineId?: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  quantityReceived?: number;
  quantityRemaining?: number;
  isActive?: boolean;
  remarks?: string;
}

const emptyValues: BatchFormValues = {
  purchaseOrderId: "",
  medicineId: "",
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  purchasePrice: 0,
  sellingPrice: 0,
  quantityReceived: 1,
  isActive: true,
  remarks: "",
};

function toDateInput(value?: string): string {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default function BatchFormDialog({
  open,
  onOpenChange,
  editingBatch,
  hideTrigger = false,
}: Props) {
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const medicines = useMedicines();
  const purchases = usePurchases();
  const form = useForm<BatchFormValues>({ defaultValues: emptyValues });
  const medicineId = useWatch({ control: form.control, name: "medicineId" });
  const purchaseOrderId = useWatch({
    control: form.control,
    name: "purchaseOrderId",
  });

  useEffect(() => {
    if (editingBatch) {
      form.reset({
        batchNumber: editingBatch.batchNumber,
        manufacturingDate: toDateInput(editingBatch.manufacturingDate),
        expiryDate: toDateInput(editingBatch.expiryDate),
        purchasePrice: editingBatch.purchasePrice,
        sellingPrice: editingBatch.sellingPrice,
        quantityRemaining: editingBatch.quantityRemaining,
        isActive: editingBatch.isActive ?? true,
        remarks: "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [editingBatch, form]);

  const isEditing = Boolean(editingBatch);
  const isPending = createBatch.isPending || updateBatch.isPending;

  const onSubmit = (values: BatchFormValues) => {
    form.clearErrors();

    if (editingBatch) {
      const parsed = updateBatchFormSchema.safeParse(values);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        form.setError(issue.path[0] as keyof BatchFormValues, {
          message: issue.message,
        });
        return;
      }

      const { remarks: _remarks, ...payload } = parsed.data;
      updateBatch.mutate(
        {
          id: editingBatch._id,
          data: {
            ...payload,
            manufacturingDate: new Date(
              parsed.data.manufacturingDate,
            ).toISOString(),
            expiryDate: new Date(parsed.data.expiryDate).toISOString(),
            ...(_remarks ? { remarks: _remarks } : {}),
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    const parsed = createBatchFormSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      form.setError(issue.path[0] as keyof BatchFormValues, {
        message: issue.message,
      });
      return;
    }

    const {
      remarks,
      quantityRemaining: _quantityRemaining,
      ...payload
    } = parsed.data;
    createBatch.mutate(
      {
        ...payload,
        manufacturingDate: new Date(
          parsed.data.manufacturingDate,
        ).toISOString(),
        expiryDate: new Date(parsed.data.expiryDate).toISOString(),
        ...(remarks ? { remarks } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isEditing && !hideTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus size={18} />
            Create batch
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit batch" : "Create batch"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!isEditing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Medicine</Label>
                <Select
                  value={medicineId}
                  onValueChange={(value) => form.setValue("medicineId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.data?.map((medicine) => (
                      <SelectItem key={medicine._id} value={medicine._id}>
                        {medicine.medicineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.medicineId && (
                  <p className="text-destructive text-xs">
                    {errors.medicineId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Purchase order</Label>
                <Select
                  value={purchaseOrderId}
                  onValueChange={(value) =>
                    form.setValue("purchaseOrderId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchases.data?.map((purchase) => (
                      <SelectItem key={purchase._id} value={purchase._id}>
                        {purchase.invoiceNumber} —{" "}
                        {purchase.supplierId.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purchaseOrderId && (
                  <p className="text-destructive text-xs">
                    {errors.purchaseOrderId.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="batch-number">Batch number</Label>
              <Input id="batch-number" {...form.register("batchNumber")} />
              {errors.batchNumber && (
                <p className="text-destructive text-xs">
                  {errors.batchNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-manufacturing">Manufacturing date</Label>
              <Input
                id="batch-manufacturing"
                type="date"
                {...form.register("manufacturingDate")}
              />
              {errors.manufacturingDate && (
                <p className="text-destructive text-xs">
                  {errors.manufacturingDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-expiry">Expiry date</Label>
              <Input
                id="batch-expiry"
                type="date"
                {...form.register("expiryDate")}
              />
              {errors.expiryDate && (
                <p className="text-destructive text-xs">
                  {errors.expiryDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-purchase-price">Purchase price</Label>
              <Input
                id="batch-purchase-price"
                type="number"
                min={0}
                step="0.01"
                {...form.register("purchasePrice", { valueAsNumber: true })}
              />
              {errors.purchasePrice && (
                <p className="text-destructive text-xs">
                  {errors.purchasePrice.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-selling-price">Selling price</Label>
              <Input
                id="batch-selling-price"
                type="number"
                min={0.01}
                step="0.01"
                {...form.register("sellingPrice", { valueAsNumber: true })}
              />
              {errors.sellingPrice && (
                <p className="text-destructive text-xs">
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-1.5">
                <Label htmlFor="batch-remaining">Quantity remaining</Label>
                <Input
                  id="batch-remaining"
                  type="number"
                  min={0}
                  {...form.register("quantityRemaining", {
                    valueAsNumber: true,
                  })}
                />
                {errors.quantityRemaining && (
                  <p className="text-destructive text-xs">
                    {errors.quantityRemaining.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="batch-received">Quantity received</Label>
                <Input
                  id="batch-received"
                  type="number"
                  min={1}
                  {...form.register("quantityReceived", {
                    valueAsNumber: true,
                  })}
                />
                {errors.quantityReceived && (
                  <p className="text-destructive text-xs">
                    {errors.quantityReceived.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("isActive")} />
              Active
            </label>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="batch-remarks">Remarks</Label>
            <Textarea
              id="batch-remarks"
              rows={2}
              {...form.register("remarks")}
            />
          </div>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save changes" : "Create batch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
