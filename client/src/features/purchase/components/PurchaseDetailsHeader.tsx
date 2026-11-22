import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { PurchaseDetails } from "../types/PurchaseDetails";
import InvoiceActions from "./InvoiceActions";

interface Props {
  purchase?: PurchaseDetails;
}

export default function PurchaseDetailsHeader({ purchase }: Props) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">Purchase order</p>
            <h2 className="text-lg font-semibold">
              {purchase?.invoiceNumber ?? "-"}
            </h2>
          </div>
          {purchase?.status && <Badge>{purchase.status}</Badge>}
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Supplier</p>
            <p className="font-medium">{purchase?.supplier?.companyName}</p>
            <p className="text-muted-foreground">
              {purchase?.supplier?.phone}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Order date</p>
            <p>{purchase?.orderDate ? formatDate(purchase.orderDate) : "-"}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Expected delivery</p>
            <p>
              {purchase?.expectedDeliveryDate
                ? formatDate(purchase.expectedDeliveryDate)
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Received date</p>
            <p>
              {purchase?.receivedDate
                ? formatDate(purchase.receivedDate)
                : "-"}
            </p>
          </div>
        </div>

        {purchase && (
          <InvoiceActions
            purchaseId={purchase._id}
            invoiceNumber={purchase.invoiceNumber}
            hasInvoice={Boolean(purchase.invoiceFile)}
          />
        )}
      </CardContent>
    </Card>
  );
}
