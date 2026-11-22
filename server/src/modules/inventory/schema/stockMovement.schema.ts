import { z } from "zod";

export const stockMovementTypeSchema = z.enum([
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
  "EXPIRED",
  "RESERVE",
  "RELEASE",
  "PURCHASE_RETURN",
]);

export const stockReferenceTypeSchema = z.enum([
  "PURCHASE_ORDER",
  "PURCHASE",
  "SALE",
  "RETURN",
  "SALES_RETURN",
  "ADJUSTMENT",
  "RESERVE",
  "RELEASE",
  "PURCHASE_RETURN",
  "SYSTEM",
]);
