import { CalendarDays, AlertCircle, PackageSearch } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

const batches = [
  {
    medicine: "Amoxicillin 500mg",
    batch: "AMX-2026-01",
    supplier: "ABC Pharma",
    expiry: "15 Aug 2026",
    days: 12,
    status: "Critical",
  },
  {
    medicine: "Paracetamol 500mg",
    batch: "PCM-2026-04",
    supplier: "HealthCare Ltd",
    expiry: "02 Sep 2026",
    days: 30,
    status: "Warning",
  },
  {
    medicine: "Vitamin D3",
    batch: "VD-2026-08",
    supplier: "Nepal Pharma",
    expiry: "25 Oct 2026",
    days: 80,
    status: "Safe",
  },
];

export default function ExpiringMedicines() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Expiring Medicines</CardTitle>

        <CardDescription>Medicines approaching expiry date</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {batches.map((item) => (
          <div
            key={item.batch}
            className="rounded-xl border p-4 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <PackageSearch size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">{item.medicine}</h3>

                  <p className="text-muted-foreground text-sm">
                    Batch: {item.batch}
                  </p>

                  <p className="text-muted-foreground text-sm">
                    Supplier: {item.supplier}
                  </p>
                </div>
              </div>

              {item.status === "Critical" && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle size={13} />
                  Critical
                </Badge>
              )}

              {item.status === "Warning" && (
                <Badge className="bg-amber-500 hover:bg-amber-600">
                  Warning
                </Badge>
              )}

              {item.status === "Safe" && (
                <Badge className="bg-emerald-600">Safe</Badge>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarDays size={16} />

                {item.expiry}
              </div>

              <span className="text-sm font-medium">{item.days} days left</span>
            </div>

            <Button variant="outline" size="sm" className="mt-4 w-full">
              View Batch
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
