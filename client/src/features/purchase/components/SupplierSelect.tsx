import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupplier } from "@/features/seller/hooks/useSuppliers";

interface Props {
  value?: string;
  onChange: (value: string) => void;
}
export default function SupplierSelect({ value, onChange }: Props) {
  const { data: suppliers = [], isLoading } = useSupplier();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue
          placeholder={isLoading ? "Loading suppliers..." : "Select supplier"}
        />
      </SelectTrigger>

      <SelectContent>
        {suppliers.map((supplier: any) => (
          <SelectItem key={supplier._id} value={supplier._id}>
            {supplier.companyName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
