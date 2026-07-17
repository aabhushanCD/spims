import { Card, CardContent } from "@/components/ui/card";

interface Props {
  purchase: any;
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

          <p className="font-medium">{purchase?.data?.supplier?.companyName}</p>

          <p className="text-muted-foreground text-sm">
            {purchase?.data?.supplier?.phone}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>
          {purchase?.data?.status}
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>

          <p>{purchase?.data?.invoiceNumber}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Purchase Date</p>

          <p>{new Date(purchase?.data?.orderDate).toLocaleDateString()}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm">Expected Delivery</p>

          <p>
            {purchase?.data?.expectedDeliveryDate
              ? new Date(
                  purchase?.data?.expectedDeliveryDate,
                ).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
