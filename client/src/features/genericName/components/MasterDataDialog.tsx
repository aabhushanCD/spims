import { useEffect } from "react";
import { Plus } from "lucide-react";
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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  type MasterData,
  type MasterDataResource,
} from "../types/masterData.types";

import { useCreateMasterData } from "../hooks/useCreateMasterData";
import { useUpdateMasterData } from "../hooks/useUpdateMasterData";
import {
  masterDataSchema,
  type MasterDataForm,
} from "../schema/masterData.schema";
import { Switch } from "@/components/ui/switch";

interface Props {
  config: {
    resource: MasterDataResource;
    pageTitle: string;
    entityName: string;
    description: string;
    isActive: boolean;
  };

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  editingItem?: MasterData | null;
}

export default function MasterDataDialog({
  config,
  open,
  onOpenChange,
  editingItem,
}: Props) {
  const createMutation = useCreateMasterData(config.resource);

  const updateMutation = useUpdateMasterData(config.resource);

  const form = useForm<MasterDataForm>({
    resolver: zodResolver(masterDataSchema),

    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        description: editingItem.description ?? "",
        isActive: editingItem.isActive,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
      });
    }
  }, [editingItem, form]);

  function onSubmit(values: MasterDataForm) {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem._id,
        data: values,
      });
    } else {
      createMutation.mutate(values);
    }

    form.reset();

    onOpenChange?.(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingItem && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus size={18} />
            Add
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? `Edit ${config.entityName}`
              : `Add ${config.entityName}`}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>

                  <FormControl>
                    <Input
                      placeholder={`Enter ${config.entityName}`}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>

                  <FormControl>
                    <Input
                      placeholder={`Enter ${config.entityName} description`}
                      {...field}
                    />
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
                  <div>
                    <FormLabel>Active</FormLabel>

                    <p className="text-muted-foreground text-sm">
                      Enable this item
                    </p>
                  </div>

                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
