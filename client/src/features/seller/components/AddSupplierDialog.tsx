import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { supplierSchema, type SupplierForm } from "../schema/supplier.schema";

import type { Supplier } from "../types/supplier.types";

import { useCreateSupplier } from "../hooks/useCreateSupplier";
import { useUpdateSupplier } from "../hooks/useUpdateSupplier";
import { Plus } from "lucide-react";

interface Props {
  editingSupplier?: Supplier | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddSupplierDialog({
  editingSupplier,
  open,
  onOpenChange,
}: Props) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),

    defaultValues: {
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      panNumber: "",
      isActive: true,
      leadTime: 3,
    },
  });

  console.log("form error state", form.formState.errors);

  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        companyName: editingSupplier.companyName,
        contactPerson: editingSupplier.contactPerson ?? "",
        phone: editingSupplier.phone,
        email: editingSupplier.email ?? "",
        address: editingSupplier.address ?? "",
        panNumber: editingSupplier.panNumber ?? "",
        isActive: editingSupplier.isActive,
        leadTime: editingSupplier.leadTime ?? undefined,
      });
    } else {
      form.reset();
      onOpenChange?.(false);
    }
  }, [editingSupplier, form]);

  function onSubmit(values: SupplierForm) {
    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier._id, data: values });
    } else {
      createSupplier.mutate(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingSupplier && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-emerald-600">
            <Plus />
            Add Supplier
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            {/* Supplier Name */}

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>

                  <FormControl>
                    <Input placeholder="ABC Pharma" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Person */}

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>

                  <FormControl>
                    <Input placeholder="Ram Sharma" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>

                  <FormControl>
                    <Input placeholder="98XXXXXXXX" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>

                  <FormControl>
                    <Input
                      type="email"
                      placeholder="supplier@email.com"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PAN */}

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>

                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <FormLabel>Active</FormLabel>

                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leadTime"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <FormLabel>Lead Time (days)</FormLabel>

                  <FormControl>
                    <Input type="number" placeholder="3" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Address */}

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>

                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Supplier address"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {editingSupplier ? "Update Supplier" : "Create Supplier"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
