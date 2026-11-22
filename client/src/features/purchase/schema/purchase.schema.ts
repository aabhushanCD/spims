import { z } from "zod";

export const purchaseItemSchema = z.object({
  /** Present only while editing an existing purchase-order item. */
  purchaseOrderItemId: z.string().optional(),

  medicineId: z.string().min(1, "Medicine is required"),

  quantity: z.coerce.number().min(1, "Quantity is required"),

  purchasePrice: z.coerce.number().min(0.01, "Purchase price is required"),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),

  orderDate: z.coerce.date(),

  expectedDeliveryDate: z
    .date()
    .nullable()
    .optional()
    .transform((value) => value ?? undefined),

  invoiceNumber: z.string().min(1, "Invoice number is required"),

  invoiceFile: z.string().optional(),

  discount: z.coerce
    .number()
    .min(0, "Discount must be greater than or equal to zero")
    .default(0),
  VAT: z.coerce
    .number()
    .min(0, "VAT must be greater than or equal to zero")
    .default(13),
  items: z.array(purchaseItemSchema).min(1, "Add at least one medicine"),
});

export type PurchaseForm = z.infer<typeof purchaseSchema>;
