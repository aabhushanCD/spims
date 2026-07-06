export interface ReceivePurchaseOrderDto {
  items: {
    medicineId: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    sellingPrice: number;
    quantityReceived: number;
    remarks: string;
  }[];
}
