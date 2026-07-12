import { Card, CardContent } from "@/components/ui/card";

export default function PurchaseTable() {
  return (
    <Card>
      <CardContent className="p-10">
        <div className="text-muted-foreground text-center">
          No purchase orders found.
        </div>
      </CardContent>
    </Card>
  );
}
