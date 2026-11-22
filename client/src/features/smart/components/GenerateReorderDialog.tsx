import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { useMedicines } from "@/features/medicine/hooks/useMedicines";
import { useGenerateRecommendation } from "../hooks/useSmartMutate";

interface Props {
  onOpenChange: (open: boolean) => void;
}

export default function GenerateReorderDialog({ onOpenChange }: Props) {
  const medicines = useMedicines();
  const generate = useGenerateRecommendation();
  const [medicineId, setMedicineId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!medicineId) {
      setError("Select a medicine");
      return;
    }

    setError(null);
    generate.mutate(medicineId, {
      onSuccess: () => onOpenChange(false),
      onError: (mutationError) => {
        setError(
          getApiErrorMessage(
            mutationError,
            "No recommendation was created for this medicine",
          ),
        );
      },
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate recommendation</DialogTitle>
          <DialogDescription>
            Generates a recommendation for one medicine when it is below its
            reorder point and has purchase history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Medicine</Label>
            <Select value={medicineId} onValueChange={setMedicineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {medicines.data?.map((medicine) => (
                  <SelectItem key={medicine._id} value={medicine._id}>
                    {medicine.medicineName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generate.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={generate.isPending}>
            {generate.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
