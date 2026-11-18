import { Card, CardContent } from "@/components/ui/card";
import type { PurchaseDetails } from "../types/PurchaseDetails";

interface Props {
  purchase?: PurchaseDetails;
}

export default function PurchaseDetailsHeader({ purchase }: Props) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-sm">Purchase Order</p>

          <h2 className="text-lg font-semibold">
            {/* {purchase.purchaseOrderNumber} */}
          </h2>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Supplier</p>

          <p className="font-medium">{purchase?.supplier?.companyName}</p>

          <p className="text-muted-foreground text-sm">
            {purchase?.supplier?.phone}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>
          {purchase?.status}
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>

          <p>{purchase?.invoiceNumber}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Purchase Date</p>

          <p>
            {purchase?.orderDate
              ? new Date(purchase.orderDate).toLocaleDateString()
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Expected Delivery</p>

          <p>
            {purchase?.expectedDeliveryDate
              ? new Date(purchase?.expectedDeliveryDate).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
