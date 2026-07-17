import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().nonempty("Supplier ID is required"),
  orderDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date(),
  invoiceNumber: z.string().nonempty("Invoice number is required"),
  discount: z
    .number()
    .nonnegative("Discount must be greater than or equal to zero")
    .default(0),
  invoiceFile: z.string().default(""),

  receivedDate: z.coerce.date(),
  status: z
    .enum(["pending", "approved", "received", "cancelled"])
    .default("pending"),
  VAT: z
    .number()
    .nonnegative("VAT must be greater than or equal to zero")
    .default(13),
  items: z.array(
    z.object({
      medicineId: z.string().nonempty("Medicine ID is required"),
      quantity: z.number().positive("Quantity must be greater than zero"),
      purchasePrice: z
        .number()
        .positive("Purchase price must be greater than zero"),
    }),
  ),
});

export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
