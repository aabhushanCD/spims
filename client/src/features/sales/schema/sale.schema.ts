// features/sales/schema/sale.schema.ts
import { z } from "zod";

export const paymentMethodEnum = z.enum([
  "CASH",
  "CARD",
  "QR",
  "Mobile Banking",
  "CREDIT",
]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const saleItemSchema = z.object({
  medicineId: z.string().min(1, "Select a medicine"),
  medicineName: z.string().min(1), // display only, not sent to backend
  /** FEFO preview only — the server allocates the batch. */
  batchId: z.string().optional(),
  batchNo: z.string().optional(), // display only, not sent to backend
  vatPercentage: z.coerce.number().min(0).default(13), // default VAT percentage
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),

  discountPercentage: z.coerce
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),

  // client-side display/estimate only — backend computes actual price from batch
  unitPrice: z.coerce.number().min(0),
  availableStock: z.number(),
});

export const saleFormSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required").max(100),
    discountPercentage: z.coerce.number().min(0).max(100).default(0),
    paymentMethod: paymentMethodEnum,
    discount: z.number().min(0).default(0), // sale-level discount
    items: z
      .array(saleItemSchema)
      .min(1, "Add at least one medicine to the sale"),
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (
        typeof item.availableStock === "number" &&
        item.quantity > item.availableStock
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "quantity"],
          message: `Only ${item.availableStock} in stock`,
        });
      }
    });
  });

export type SaleFormValues = z.infer<typeof saleFormSchema>;
export type SaleItemFormValues = z.infer<typeof saleItemSchema>;
