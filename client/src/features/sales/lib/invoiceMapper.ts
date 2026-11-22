import type {
  InvoiceItemPayload,
  SaleDetails,
  SaleInvoicePayload,
} from "../types/sale.types";

function getBatch(item: InvoiceItemPayload) {
  return item.batchId && typeof item.batchId === "object"
    ? item.batchId
    : null;
}

export function mapInvoiceToSaleDetails(
  payload: SaleInvoicePayload,
): SaleDetails {
  const { sale, items, summary } = payload;

  return {
    _id: sale._id,
    id: sale._id,
    invoiceNo: sale.invoiceNumber,
    customerName: sale.customerName,
    customerPhone: sale.customerId?.phone,
    cashierName: sale.cashierId?.name ?? "-",
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    createdAt: sale.saleDate,
    items: items.map((item) => {
      const gross = item.unitPrice * item.quantity;
      const batch = getBatch(item);

      return {
        id: item._id,
        medicineId: item.medicineId._id,
        medicineName: item.medicineId.medicineName,
        batchNumber: batch?.batchNumber,
        batchExpiryDate: batch?.expiryDate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage:
          gross > 0 ? Math.round((item.discount / gross) * 1000) / 10 : 0,
        vatPercentage: item.vatRate ?? 13,
        total: item.totalPrice,
      };
    }),
    subtotal: sale.subTotal,
    discountTotal: sale.discount,
    vatTotal: sale.VAT,
    grandTotal: sale.totalAmount,
    paidAmount: summary?.paidAmount ?? 0,
    amountDue: summary?.amountDue ?? sale.totalAmount,
  };
}
