import { AlertTriangle, ShoppingCart } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";

const medicines = [
  {
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    stock: 8,
    reorder: 50,
    status: "Critical",
  },
  {
    name: "Azithromycin 250mg",
    category: "Antibiotic",
    stock: 18,
    reorder: 60,
    status: "Low",
  },
  {
    name: "Vitamin C",
    category: "Supplement",
    stock: 35,
    reorder: 80,
    status: "Low",
  },
  {
    name: "Metformin 500mg",
    category: "Diabetes",
    stock: 45,
    reorder: 100,
    status: "Normal",
  },
];

export default function LowStockMedicines() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Reorder Recommendation</CardTitle>

        <CardDescription>Medicines that need attention</CardDescription>
      </CardHeader>

      <CardContent className="max-h-130 space-y-5 overflow-auto">
        {medicines.map((medicine) => {
          const percentage = (medicine.stock / medicine.reorder) * 100;

          return (
            <div
              key={medicine.name}
              className="space-y-3 rounded-xl border p-4 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{medicine.name}</h3>

                  <p className="text-muted-foreground text-sm">
                    {medicine.category}
                  </p>
                </div>

                {medicine.status === "Critical" ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle size={13} />
                    Critical
                  </Badge>
                ) : (
                  <Badge variant="secondary">{medicine.status}</Badge>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span>Stock: {medicine.stock}</span>

                <span className="text-muted-foreground">
                  Reorder: {medicine.reorder}
                </span>
              </div>

              <Progress value={percentage} />

              <Button size="sm" variant="outline" className="mt-2 gap-2">
                <ShoppingCart size={15} />
                Restock
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
