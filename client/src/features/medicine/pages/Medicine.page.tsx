import PageHeader from "@/components/common/PageToolbar";

import MedicineTable from "../components/MedicineTable";
import AddMedicineDialog from "../components/AddMedicineDialog";
import BarcodeLookupDialog from "../components/BarcodeLookupDialog";
import { useDeferredValue, useState } from "react";

export default function MedicinePage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicines"
        description="Manage pharmacy medicines"
        searchPlaceholder="Search medicine..."
        searchValue={search}
        onSearchChange={setSearch}
        action={
          <div className="flex flex-wrap gap-2">
            <BarcodeLookupDialog />
            <AddMedicineDialog />
          </div>
        }
      />
      <MedicineTable search={deferredSearch} />
    </div>
  );
}
