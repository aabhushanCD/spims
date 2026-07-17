import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePurchase } from "../hooks/usePurchase";
import PurchaseDetailsHeader from "./PurchaseDetailsHeader";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
import PurchaseItemsDetailsTable from "./PurchaseDetailItemsTable";
import PurchaseSummary from "./PurchaseSummary";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { useApprovePurchase } from "../hooks/useApprovePurchase";

interface Props {
  purchaseId: string | null;
}

export default function PurchaseDetailsDialog({ purchaseId }: Props) {
  const { data: purchase, isLoading } = usePurchase(purchaseId || undefined);
  
  const approvePurchase = useApprovePurchase(purchaseId || "");
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="">
          <Eye size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>
        <PurchaseDetailsHeader purchase={purchase} />

        <PurchaseItemsDetailsTable purchase={purchase} />

        <PurchaseSummary
          purchase={purchase}
          onApprove={() => approvePurchase.mutate(purchaseId || "")}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
