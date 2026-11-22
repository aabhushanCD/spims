import { useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseService } from "../services/purchase.service";
import InvoiceUploadDialog from "./InvoiceUploadDialog";

interface Props {
  purchaseId: string;
  invoiceNumber: string;
  hasInvoice: boolean;
}

export default function InvoiceActions({
  purchaseId,
  invoiceNumber,
  hasInvoice,
}: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await purchaseService.downloadInvoice(purchaseId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${invoiceNumber.replace(/[^a-z0-9._-]/gi, "_")}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download invoice"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setUploadOpen(true)}>
        <FileUp className="mr-2 h-4 w-4" />
        Upload invoice
      </Button>

      {hasInvoice && (
        <Button
          variant="outline"
          onClick={() => void handleDownload()}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download invoice
        </Button>
      )}

      {uploadOpen && (
        <InvoiceUploadDialog
          purchaseId={purchaseId}
          invoiceNumber={invoiceNumber}
          onOpenChange={setUploadOpen}
        />
      )}
    </div>
  );
}
