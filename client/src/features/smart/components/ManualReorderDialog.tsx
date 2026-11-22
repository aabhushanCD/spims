import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMedicines } from "@/features/medicine/hooks/useMedicines";
import { useSupplier } from "@/features/supplier/hooks/useSuppliers";
import { useCreateManualRecommendation } from "../hooks/useSmartMutate";

interface Props {
  onOpenChange: (open: boolean) => void;
}

export default function ManualReorderDialog({ onOpenChange }: Props) {
  const medicines = useMedicines();
  const suppliers = useSupplier();
  const create = useCreateManualRecommendation();
  const [medicineId, setMedicineId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suggestedQuantity, setSuggestedQuantity] = useState("1");
  const [confidenceScore, setConfidenceScore] = useState("50");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const quantity = Number(suggestedQuantity);
    const confidence = Number(confidenceScore);

    if (!medicineId || !supplierId) {
      setError("Select a medicine and supplier");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Suggested quantity must be greater than zero");
      return;
    }
    if (
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      setError("Confidence must be between 0 and 100");
      return;
    }
    if (recommendationReason.trim().length === 0) {
      setError("Enter a recommendation reason");
      return;
    }

    setError(null);
    create.mutate(
      {
        medicineId,
        supplierId,
        suggestedQuantity: quantity,
        confidenceScore: confidence,
        recommendationReason: recommendationReason.trim(),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual reorder recommendation</DialogTitle>
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

          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.data?.map((supplier) => (
                  <SelectItem key={supplier._id} value={supplier._id}>
                    {supplier.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-quantity">Suggested quantity</Label>
              <Input
                id="manual-quantity"
                type="number"
                min={1}
                value={suggestedQuantity}
                onChange={(event) => setSuggestedQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-confidence">Confidence (0–100)</Label>
              <Input
                id="manual-confidence"
                type="number"
                min={0}
                max={100}
                value={confidenceScore}
                onChange={(event) => setConfidenceScore(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-reason">Reason</Label>
            <Textarea
              id="manual-reason"
              rows={3}
              value={recommendationReason}
              onChange={(event) => setRecommendationReason(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
