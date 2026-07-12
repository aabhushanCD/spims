import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Textarea } from "@/components/ui/textarea";

import type { PurchaseForm } from "../schema/purchase.schema";

interface Props {
  form: UseFormReturn<PurchaseForm>;
}

export default function PurchaseNotes({ form }: Props) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>

          <FormControl>
            <Textarea rows={4} placeholder="Additional notes..." {...field} />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
