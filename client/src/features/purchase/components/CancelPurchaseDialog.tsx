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
import { useCancelPurchase } from "../hooks/usePurchaseActions";

interface Props {
  purchaseId: string;
  invoiceNumber: string;
  onOpenChange: (open: boolean) => void;
}

export default function CancelPurchaseDialog({
  purchaseId,
  invoiceNumber,
  onOpenChange,
}: Props) {
  const cancelPurchase = useCancelPurchase(purchaseId);

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel purchase order?</AlertDialogTitle>
          <AlertDialogDescription>
            {invoiceNumber} will be marked cancelled. Received orders cannot be
            cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelPurchase.isPending}>
            Keep order
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancelPurchase.isPending}
            onClick={() =>
              cancelPurchase.mutate(undefined, {
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            {cancelPurchase.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Cancel order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
