import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Customer } from "../types/customer.types";
import { useDeleteCustomer } from "../hooks/useCustomerMutations";

interface Props {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerDeleteDialog({
  customer,
  onOpenChange,
}: Props) {
  const deleteCustomer = useDeleteCustomer();

  return (
    <AlertDialog
      open={Boolean(customer)}
      onOpenChange={(open) => !open && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes{" "}
            <span className="font-medium">{customer?.name}</span>. Historical
            sales keep their customer-name snapshot.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCustomer.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteCustomer.isPending}
            onClick={() => {
              if (!customer) return;
              deleteCustomer.mutate(customer._id, {
                onSuccess: () => onOpenChange(false),
              });
            }}
          >
            {deleteCustomer.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
