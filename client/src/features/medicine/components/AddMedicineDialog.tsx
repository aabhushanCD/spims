import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

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
} from "../../../components/ui/form";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";
import {
  medicineSchema,
  type MedicineFormInput,
} from "../schema/medicine.schema";
import { useCreateMedicine } from "../hooks/useCreateMedicine";
import { MasterSelectOptions } from "./MasterSelectOptions";
import { useMedicineOptions } from "../hooks/useMedicineOptions";

export default function AddMedicineDialog() {
  const { genericNames, brands, categories, units } = useMedicineOptions();
  const form = useForm<MedicineFormInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
     medicineName: "",
      genericNameId: "",
      categoryId: "",
      brandId: "",
      manufacturer: "",
      barcode: "",
      dosageForm: "",
      strength: "",
      reorderLevel: 10,
      description: "",
    },
  });
  const createMedicine = useCreateMedicine();
  
  
  function onSubmit(values: MedicineFormInput) {
    createMedicine.mutate(values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600">
          <Plus size={18} />
          Add Medicine
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}

            className="grid grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}

              name="medicineName"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Name</FormLabel>

                  <FormControl>
                    <Input placeholder="Paracetamol 500mg" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}

              name="strength"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strength</FormLabel>

                  <FormControl>
                    <Input placeholder="500mg" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}

              name="manufacturer"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>

                  <FormControl>
                    <Input placeholder="Cipla" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}

              name="barcode"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>

                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}

              name="dosageForm"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage Form</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Tablet | Capsule | Syrup | Drops | Injection.."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}

              name="reorderLevel"

              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Level</FormLabel>

                  <FormControl>
                    <Input
                      type="number"

                      value={field.value}

                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <MasterSelectOptions
              control={form.control}
              name="genericNameId"
              label="Generic Name"
              placeholder="Select a generic name"
              options={genericNames.data}
            />
            <MasterSelectOptions
              control={form.control}
              name="unitId"
              label="Unit"
              placeholder="Select a unit"
              options={units.data}
            />
            <MasterSelectOptions
              control={form.control}
              name="categoryId"
              label="Category"
              placeholder="Select a category"
              options={categories.data}
            />
            <MasterSelectOptions
              control={form.control}
              name="brandId"
              label="Brand"
              placeholder="Select a brand"
              options={brands.data}
            />
            <div className="col-span-2">
              <Button type="submit" className="w-full bg-emerald-600">
                Save Medicine
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
