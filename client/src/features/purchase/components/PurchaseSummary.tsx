import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReceivePurchaseDialog from "./ReceivePurchaseDialog";
import type { PurchaseDetails } from "../types/PurchaseDetails";

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
  return (
    <Card>
      <CardContent className="space-y-6 p-4">
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-semibold">Grand Total</span>

          <span className="text-xl font-bold">
            Rs. {purchase?.totalAmount}
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {purchase?.status === "pending" && (
            <Button onClick={onApprove}>Approve</Button>
          )}

          {purchase?.status === "approved" && (
            <Button onClick={() => setReceiveOpen(true)}>Receive</Button>
          )}
          {purchase?.status === "received" && (
            <Button disabled>Received</Button>
          )}
          {receiveOpen && (
            <ReceivePurchaseDialog
              open={receiveOpen}
              onOpenChange={setReceiveOpen}
              purchase={purchase}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
