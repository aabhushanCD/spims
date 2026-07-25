import { z } from "zod";
import mongoose from "mongoose";

/**
 * Sales Item Schema
 */
export const createSalesItemSchema = z.object({
  batchId: z.string("Batch ID is required").min(1, "Batch ID is required"),

  medicineId: z
    .string("Medicine ID is required")
    .min(1, "Medicine ID is required"),

  quantity: z.number("Quantity is required").int().positive(),

  discountPercentage: z.number().min(0).default(0),
});

/**
 * Create Sale Schema
 */
export const createSaleSchema = z.object({
  customerName: z.string("Customer name is required").trim().min(1).max(100),

  paymentMethod: z.enum(["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"]),

  saleDate: z.coerce.date(),

  discount: z.number().min(0).default(0),

  items: z
    .array(createSalesItemSchema)
    .min(1, "At least one sale item is required"),
});

/**
 * Update Sale Schema
 */
export const updateSaleSchema = z.object({
  customerName: z.string().trim().min(1).max(100).optional(),

  paymentMethod: z
    .enum(["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"])
    .optional(),

  saleDate: z.coerce.date().optional(),

  discount: z.number().min(0).optional(),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema> & {
  cashierId: string;
};
export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;
