export interface BatchAllocation {
  batchId: string;
  medicineId: string;
  quantity: number;
  /** Selling price at allocation time. */
  unitPrice: number;
  /** Batch purchase price at allocation time, snapshotted onto the sale item. */
  purchasePrice: number;
  batchNumber: string;
}
