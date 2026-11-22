import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  customerSchema,
  type CustomerForm,
} from "../schema/customer.schema";
import type { Customer } from "../types/customer.types";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "../hooks/useCustomerMutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer?: Customer | null;
  onCreated?: (customer: Customer) => void;
  hideTrigger?: boolean;
}

const emptyValues: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  isActive: true,
};

function toPayload(values: CustomerForm): CustomerForm {
  return {
    name: values.name.trim(),
    ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
    ...(values.email?.trim() ? { email: values.email.trim() } : {}),
    ...(values.address?.trim() ? { address: values.address.trim() } : {}),
    isActive: values.isActive,
  };
}

export default function CustomerDialog({
  open,
  onOpenChange,
  editingCustomer,
  onCreated,
  hideTrigger = false,
}: Props) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        phone: editingCustomer.phone ?? "",
        email: editingCustomer.email ?? "",
        address: editingCustomer.address ?? "",
        isActive: editingCustomer.isActive,
      });
    } else {
      form.reset(emptyValues);
    }
  }, [editingCustomer, form]);

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  const onSubmit = (values: CustomerForm) => {
    const payload = toPayload(values);

    if (editingCustomer) {
      updateCustomer.mutate(
        { id: editingCustomer._id, data: payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createCustomer.mutate(payload, {
        onSuccess: (customer) => {
          onCreated?.(customer);
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingCustomer && !hideTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus size={18} />
            Add customer
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCustomer ? "Edit customer" : "Add customer"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCustomer ? "Save changes" : "Create customer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
