export const INVOICE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const ALLOWED_EXTENSIONS = /\.(pdf|png|jpe?g)$/i;

export function validateInvoiceFile(file: File): string | null {
  if (file.size > INVOICE_MAX_BYTES) {
    return "Invoice must be 5 MB or smaller";
  }

  const typeAllowed =
    ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);

  if (!typeAllowed) {
    return "Only PDF, PNG, or JPEG invoices are allowed";
  }

  return null;
}
