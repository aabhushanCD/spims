import type { SaleFormValues } from "../schema/sale.schema";
import type { CreateSaleInput } from "../types/sale.types";

/**
 * Converts the sale form into the server contract.
 *
 * Batch IDs are deliberately omitted: the server allocates FEFO stock and
 * rejects/ignores client-selected batches.
 */
export function toCreateSalePayload(
  values: SaleFormValues,
  saleDate: Date = new Date(),
): CreateSaleInput {
  return {
    customerName: values.customerName,
    paymentMethod: values.paymentMethod,
    saleDate: saleDate.toISOString(),
    discount: values.discount,
    items: values.items.map((item) => ({
      medicineId: item.medicineId,
      quantity: item.quantity,
      discountPercentage: item.discountPercentage,
    })),
  };
}
