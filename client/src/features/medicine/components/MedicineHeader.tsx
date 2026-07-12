import {  Search } from "lucide-react";


import { Card, CardContent } from "@/components/ui/card";
import AddMedicineDialog from "./AddMedicineDialog";

export default function MedicineHeader() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicines</h1>

          <p className="text-muted-foreground text-sm">
            Manage pharmacy medicines
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <Search size={18} />

            <input
              placeholder="Search medicine..."
              className="h-10 outline-none"
            />
          </div>

          <AddMedicineDialog />
        </div>
      </CardContent>
    </Card>
  );
}
