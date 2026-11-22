import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReceivePurchaseDialog from "./ReceivePurchaseDialog";
import CancelPurchaseDialog from "./CancelPurchaseDialog";
import type { PurchaseDetails } from "../types/PurchaseDetails";
import { formatCurrency } from "@/lib/format";

interface Props {
  purchase?: PurchaseDetails;
  onApprove?: () => void;
  onClose: () => void;
}

export default function PurchaseSummary({
  purchase,
  onApprove,
  onClose,
}: Props) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-6 p-4">
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-semibold">Grand Total</span>
          <span className="text-xl font-bold">
            {formatCurrency(purchase?.totalAmount ?? 0)}
          </span>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {(purchase?.status === "pending" ||
            purchase?.status === "approved") &&
            purchase && (
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancel order
              </Button>
            )}

          {purchase?.status === "pending" && (
            <Button onClick={onApprove}>Approve</Button>
          )}

          {(purchase?.status === "approved" ||
            purchase?.status === "partially_received") && (
            <Button onClick={() => setReceiveOpen(true)}>Receive</Button>
          )}

          {purchase?.status === "received" && (
            <Button disabled>Received</Button>
          )}

          {receiveOpen && purchase && (
            <ReceivePurchaseDialog
              open={receiveOpen}
              onOpenChange={setReceiveOpen}
              purchase={purchase}
            />
          )}

          {cancelOpen && purchase && (
            <CancelPurchaseDialog
              purchaseId={purchase._id}
              invoiceNumber={purchase.invoiceNumber}
              onOpenChange={setCancelOpen}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
