import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const INVOICE_UPLOAD_DIR = path.resolve(
  process.cwd(),
  "uploads",
  "purchase-invoices",
);

fs.mkdirSync(INVOICE_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, INVOICE_UPLOAD_DIR);
  },
  filename: (req, file, callback) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-120);
    callback(
      null,
      `${req.params.id}-${Date.now()}-${safeName || "invoice"}`,
    );
  },
});

export const invoiceUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      callback(new Error("Only PDF, PNG, or JPEG invoices are allowed"));
      return;
    }
    callback(null, true);
  },
});
