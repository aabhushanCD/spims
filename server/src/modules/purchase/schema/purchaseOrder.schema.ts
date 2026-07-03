import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().nonempty("Supplier ID is required"),
  orderDate: z.string().nonempty("Order date is required"),
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
