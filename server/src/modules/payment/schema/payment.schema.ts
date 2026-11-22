import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "QR",
  "Mobile Banking",
  "CREDIT",
]);

export const createPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero"),
  method: paymentMethodSchema,
  reference: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

export const salePaymentParamSchema = z.object({ id: objectIdSchema });

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
