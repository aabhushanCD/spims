import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useMedicines } from "@/features/medicine/hooks/useMedicines";

interface Props {
  value?: string;
  onChange: (value: string) => void;
}

export default function MedicineSelect({ value, onChange }: Props) {
  const { data: medicines = [], isLoading } = useMedicines();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue
          placeholder={isLoading ? "Loading medicines..." : "Select medicine"}
        />
      </SelectTrigger>

      <SelectContent>
        {medicines.map((medicine) => (
          <SelectItem key={medicine._id} value={medicine._id}>
            {medicine.medicineName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
