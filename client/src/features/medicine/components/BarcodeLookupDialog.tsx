import { useState } from "react";
import { Loader2, ScanBarcode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { medicineServices } from "../services/medicine.service";
import type { Medicine } from "../types/medicine.types";

export default function BarcodeLookupDialog() {
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<Medicine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLookup() {
    if (!barcode.trim()) {
      setError("Enter a barcode");
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      setResult(await medicineServices.getMedicineByBarcode(barcode.trim()));
    } catch (lookupError) {
      setError(getApiErrorMessage(lookupError, "Medicine not found"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setBarcode("");
          setResult(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScanBarcode className="h-4 w-4" />
          Barcode lookup
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode lookup</DialogTitle>
          <DialogDescription>
            Find a medicine by its saved barcode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleLookup();
                  }
                }}
                placeholder="Scan or type barcode"
                autoFocus
              />
              <Button onClick={() => void handleLookup()} disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Find
              </Button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {result && (
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="text-lg font-semibold">{result.medicineName}</p>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Generic</span>
                <span>{result.genericName}</span>
                <span className="text-muted-foreground">Strength</span>
                <span>{result.strength}</span>
                <span className="text-muted-foreground">Brand</span>
                <span>{result.brand}</span>
                <span className="text-muted-foreground">Category</span>
                <span>{result.category}</span>
                <span className="text-muted-foreground">Barcode</span>
                <span>{result.barcode}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
