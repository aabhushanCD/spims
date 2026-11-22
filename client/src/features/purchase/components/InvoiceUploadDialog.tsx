import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateInvoiceFile } from "../lib/invoiceFile";
import { useUploadInvoice } from "../hooks/usePurchaseActions";

interface Props {
  purchaseId: string;
  invoiceNumber: string;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceUploadDialog({
  purchaseId,
  invoiceNumber,
  onOpenChange,
}: Props) {
  const upload = useUploadInvoice(purchaseId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUpload() {
    if (!file) {
      setError("Choose an invoice file");
      return;
    }

    const validationError = validateInvoiceFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    upload.mutate(file, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload invoice</DialogTitle>
          <DialogDescription>
            {invoiceNumber}. PDF, PNG, or JPEG, up to 5 MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-file">Invoice file</Label>
            <Input
              id="invoice-file"
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </div>

          {file && (
            <p className="text-muted-foreground text-xs">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upload.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={upload.isPending}>
            {upload.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <FileUp className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
